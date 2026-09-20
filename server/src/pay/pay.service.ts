import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { OrderService } from '../order/order.service';

interface WxPayConfig {
  appid: string;
  mchid: string;
  apiV3Key: string;
  certSerial: string;
  privateKey: string;
  notifyUrl: string;
}

@Injectable()
export class PayService {
  private readonly baseUrl = 'https://api.mch.weixin.qq.com';
  private readonly logger = new Logger(PayService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private dataSource: DataSource,
    private orders: OrderService,
  ) {}

  async createOrder(orderId: number, userId: number, openid: string, clientIp: string): Promise<any> {
    if (!openid) throw new BadRequestException('用户 openid 缺失，请先完成微信登录');

    const config = this.getConfig();
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) throw new BadRequestException('订单不存在');
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('订单状态不可支付');

    const totalFee = Math.round(Number(order.payAmount) * 100);
    if (totalFee <= 0) throw new BadRequestException('订单金额无效');

    const body = {
      appid: config.appid,
      mchid: config.mchid,
      description: '酷礼工坊-商品购买',
      out_trade_no: order.orderNo,
      time_expire: this.formatWechatTime(new Date(Date.now() + 30 * 60 * 1000)),
      attach: `orderId=${orderId}`,
      notify_url: config.notifyUrl,
      amount: {
        total: totalFee,
        currency: 'CNY',
      },
      payer: {
        openid,
      },
      scene_info: {
        payer_client_ip: clientIp || '127.0.0.1',
      },
    };

    const result = await this.requestWxPay('/v3/pay/transactions/jsapi', body, config);
    if (!result.prepay_id) {
      throw new InternalServerErrorException('微信支付未返回 prepay_id');
    }

    const nonceStr = this.generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const packageStr = `prepay_id=${result.prepay_id}`;
    const paySign = this.signWithPrivateKey(
      `${config.appid}\n${timestamp}\n${nonceStr}\n${packageStr}\n`,
      config.privateKey,
    );

    return {
      timeStamp: timestamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA',
      paySign,
      orderNo: order.orderNo,
    };
  }

  async handleNotify(headers: Record<string, string>, body: any, rawBody: string): Promise<{ code: string; message: string }> {
    try {
      const config = this.getConfig();
      this.verifyNotifySignature(headers, rawBody);

      const resource = body?.resource;
      if (!resource?.ciphertext || !resource?.nonce) {
        throw new Error('通知数据格式不正确');
      }

      const result = this.decryptResource(resource, config.apiV3Key);
      if (result.trade_state === 'SUCCESS') await this.confirmPaid(result, config);

      return { code: 'SUCCESS', message: '成功' };
    } catch (err) {
      return { code: 'FAIL', message: (err as Error).message };
    }
  }

  async queryPayStatus(orderNo: string, userId: number): Promise<any> {
    await this.orders.findByOrderNo(orderNo, userId);
    const config = this.getConfig();
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${config.mchid}`;
    const result = await this.requestWxPay(path, null, config, 'GET');
    if (result.trade_state === 'SUCCESS') await this.confirmPaid(result, config);
    return { orderNo, tradeState: result.trade_state || 'UNKNOWN' };
  }

  private async closeOrder(orderNo: string): Promise<void> {
    const config = this.getConfig();
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}/close`;
    await this.requestWxPay(path, { mchid: config.mchid }, config, 'POST');
  }

  async cancelOrder(orderNo: string, userId: number) {
    const order = await this.orders.findByOrderNo(orderNo, userId);
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('订单状态不可取消');
    const config = this.getConfig();
    const statusPath = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${config.mchid}`;
    try {
      const status = await this.requestWxPay(statusPath, null, config, 'GET');
      if (status.trade_state === 'SUCCESS') {
        await this.confirmPaid(status, config);
        throw new BadRequestException('订单已支付，不能取消');
      }
      if (status.trade_state === 'NOTPAY') await this.closeOrder(orderNo);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // If WeChat has no transaction for this order, local cancellation is safe.
      const message = (error as Error).message || '';
      if (!message.includes('ORDER_NOT_EXIST')) throw error;
    }
    return this.orders.cancel(order.id, userId);
  }

  private async confirmPaid(result: any, config: WxPayConfig): Promise<void> {
    const orderNo = String(result?.out_trade_no || '');
    const transactionId = String(result?.transaction_id || '');
    if (!orderNo || !transactionId) throw new Error('支付通知缺少订单号或微信交易号');
    if (result.appid !== config.appid || result.mchid !== config.mchid) throw new Error('支付通知商户信息不匹配');
    if (result.amount?.currency !== 'CNY') throw new Error('支付通知币种不匹配');

    await this.dataSource.transaction(async manager => {
      const order = await manager.findOne(Order, { where: { orderNo }, lock: { mode: 'pessimistic_write' } });
      if (!order) throw new Error('支付通知对应订单不存在');
      const expected = Math.round(Number(order.payAmount) * 100);
      if (Number(result.amount?.total) !== expected || Number(result.amount?.payer_total ?? result.amount?.total) !== expected) {
        throw new Error('支付通知金额不匹配');
      }
      if (order.status === OrderStatus.PAID && order.wechatTransactionId === transactionId) return;
      if (order.status !== OrderStatus.PENDING) throw new Error('订单状态与支付通知不匹配');
      const duplicated = await manager.findOne(Order, { where: { wechatTransactionId: transactionId } });
      if (duplicated && duplicated.id !== order.id) throw new Error('微信交易号已绑定其他订单');
      order.status = OrderStatus.PAID;
      order.paidAt = new Date(result.success_time || Date.now());
      order.wechatTransactionId = transactionId;
      await manager.save(order);
    });
  }

  @Cron('0 */5 * * * *')
  async reconcileExpiredOrders(): Promise<void> {
    if (process.env.COMMERCE_ENABLED !== 'true') return;
    const cutoff = new Date(Date.now() - 35 * 60 * 1000);
    const expired = await this.orderRepo.find({ where: { status: OrderStatus.PENDING, createdAt: LessThan(cutoff) }, take: 50, order: { createdAt: 'ASC' } });
    for (const order of expired) {
      try {
        const config = this.getConfig();
        const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(order.orderNo)}?mchid=${config.mchid}`;
        const status = await this.requestWxPay(path, null, config, 'GET');
        if (status.trade_state === 'SUCCESS') await this.confirmPaid(status, config);
        else if (status.trade_state === 'NOTPAY') { await this.closeOrder(order.orderNo); await this.orders.cancel(order.id, order.userId); }
        else if (['CLOSED', 'REVOKED', 'PAYERROR'].includes(status.trade_state)) await this.orders.cancel(order.id, order.userId);
      } catch (error) {
        const message = (error as Error).message || '';
        if (message.includes('ORDER_NOT_EXIST')) await this.orders.cancel(order.id, order.userId).catch(() => undefined);
        else this.logger.warn(`订单 ${order.orderNo} 超时核对失败: ${message.slice(0, 200)}`);
      }
    }
  }

  private requestWxPay(
    path: string,
    body: any | null,
    config: WxPayConfig,
    method: string = 'POST',
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const bodyStr = body ? JSON.stringify(body) : '';
      const url = new URL(this.baseUrl + path);
      const nonceStr = this.generateNonceStr();
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = `${method}\n${url.pathname}${url.search}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
      const signature = this.signWithPrivateKey(message, config.privateKey);
      const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.certSerial}",signature="${signature}"`;

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: auth,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'kuli-gift/1.0',
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              this.verifyWechatSignature({
                timestamp: String(res.headers['wechatpay-timestamp'] || ''),
                nonce: String(res.headers['wechatpay-nonce'] || ''),
                signature: String(res.headers['wechatpay-signature'] || ''),
                serial: String(res.headers['wechatpay-serial'] || ''),
              }, data);
              resolve(data ? JSON.parse(data) : {});
            } catch (error) { reject(error); }
            return;
          }
          reject(new Error(`微信支付 API 错误(${res.statusCode}): ${data}`));
        });
      });

      req.on('error', (e) => reject(new Error(`请求微信支付失败: ${e.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('请求微信支付超时'));
      });

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  private decryptResource(resource: any, apiV3Key: string): any {
    const ciphertext = Buffer.from(resource.ciphertext, 'base64');
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const data = ciphertext.subarray(0, ciphertext.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(apiV3Key, 'utf8'), resource.nonce);
    if (resource.associated_data) decipher.setAAD(Buffer.from(resource.associated_data));
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  private verifyNotifySignature(headers: Record<string, string>, rawBody: string): void {
    this.verifyWechatSignature({ timestamp: headers['wechatpay-timestamp'], nonce: headers['wechatpay-nonce'], signature: headers['wechatpay-signature'], serial: headers['wechatpay-serial'] }, rawBody);
  }

  private verifyWechatSignature(headers: { timestamp: string; nonce: string; signature: string; serial: string }, body: string): void {
    const { timestamp, nonce, signature, serial } = headers;
    const certPath = process.env.WX_PLATFORM_CERT_PATH || '';

    if (!timestamp || !nonce || !signature || !serial) {
      throw new Error('微信支付通知签名头缺失');
    }
    if (!certPath || !fs.existsSync(certPath)) {
      throw new Error('WX_PLATFORM_CERT_PATH 未配置或文件不存在');
    }

    const cert = fs.readFileSync(certPath, 'utf8');
    const certSerial = new crypto.X509Certificate(cert).serialNumber.replace(/^0+/, '').toUpperCase();
    if (certSerial !== serial.replace(/^0+/, '').toUpperCase()) throw new Error('微信支付平台证书序列号不匹配');
    const message = `${timestamp}\n${nonce}\n${body}\n`;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(message);
    verifier.end();
    const ok = verifier.verify(cert, signature, 'base64');
    if (!ok) throw new Error('微信支付通知签名验证失败');
  }

  private getConfig(): WxPayConfig {
    const appid = process.env.WX_APPID || process.env.WECHAT_APPID || '';
    const mchid = process.env.WX_MCHID || '';
    const apiV3Key = process.env.WX_API_V3_KEY || '';
    const certSerial = process.env.WX_CERT_SERIAL || '';
    const notifyUrl = process.env.WX_NOTIFY_URL || '';
    const privateKey = this.getPrivateKey();
    const missing = [
      ['WX_APPID/WECHAT_APPID', appid],
      ['WX_MCHID', mchid],
      ['WX_API_V3_KEY', apiV3Key],
      ['WX_CERT_SERIAL', certSerial],
      ['WX_PRIVATE_KEY 或 WX_PRIVATE_KEY_PATH', privateKey],
      ['WX_NOTIFY_URL', notifyUrl],
    ].filter(([, value]) => !value).map(([key]) => key);

    if (apiV3Key && Buffer.byteLength(apiV3Key, 'utf8') !== 32) {
      throw new InternalServerErrorException('WX_API_V3_KEY 必须是 32 字节');
    }
    if (missing.length) {
      throw new InternalServerErrorException(`微信支付配置缺失: ${missing.join(', ')}`);
    }

    return { appid, mchid, apiV3Key, certSerial, privateKey, notifyUrl };
  }

  private getPrivateKey(): string {
    const raw = process.env.WX_PRIVATE_KEY || '';
    if (raw) return raw.replace(/\\n/g, '\n');

    const path = process.env.WX_PRIVATE_KEY_PATH || '';
    if (path && fs.existsSync(path)) return fs.readFileSync(path, 'utf8');
    return '';
  }

  private signWithPrivateKey(data: string, privateKey: string): string {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  private generateNonceStr(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private formatWechatTime(date: Date): string {
    const offsetMs = 8 * 60 * 60 * 1000;
    return new Date(date.getTime() + offsetMs).toISOString().replace(/\.\d{3}Z$/, '+08:00');
  }
}

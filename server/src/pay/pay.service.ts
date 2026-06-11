import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../order/entities/order.entity';

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

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
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
      if (result.trade_state === 'SUCCESS' && result.out_trade_no) {
        await this.orderRepo.update(
          { orderNo: result.out_trade_no },
          { status: OrderStatus.PAID, paidAt: new Date(result.success_time || Date.now()) },
        );
      }

      return { code: 'SUCCESS', message: '成功' };
    } catch (err) {
      return { code: 'FAIL', message: (err as Error).message };
    }
  }

  async queryPayStatus(orderNo: string): Promise<any> {
    const config = this.getConfig();
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}?mchid=${config.mchid}`;
    return this.requestWxPay(path, null, config, 'GET');
  }

  async closeOrder(orderNo: string): Promise<void> {
    const config = this.getConfig();
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderNo)}/close`;
    await this.requestWxPay(path, { mchid: config.mchid }, config, 'POST');
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
            resolve(data ? JSON.parse(data) : {});
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
    const timestamp = headers['wechatpay-timestamp'];
    const nonce = headers['wechatpay-nonce'];
    const signature = headers['wechatpay-signature'];
    const certPath = process.env.WX_PLATFORM_CERT_PATH || '';

    if (!timestamp || !nonce || !signature) {
      throw new Error('微信支付通知签名头缺失');
    }
    if (!certPath || !fs.existsSync(certPath)) {
      throw new Error('WX_PLATFORM_CERT_PATH 未配置或文件不存在');
    }

    const cert = fs.readFileSync(certPath, 'utf8');
    const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
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

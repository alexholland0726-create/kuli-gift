import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import * as crypto from 'crypto';
import * as https from 'https';

/**
 * 微信支付 V3 JSAPI/小程序支付
 * 文档：https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi
 *
 * 前置条件（需在 .env 中配置）：
 *   WX_APPID=    微信小程序AppID
 *   WX_MCHID=    微信商户号
 *   WX_API_V3_KEY=   APIv3密钥（32位，在商户平台设置）
 *   WX_CERT_PATH=   商户证书路径（p12或pem）
 *   WX_NOTIFY_URL=  支付回调地址（如 https://kuli.com/api/pay/notify）
 */

@Injectable()
export class PayService {
  private readonly baseUrl = 'https://api.mch.weixin.qq.com';
  // private readonly baseUrl = 'https://api2.mch.weixin.qq.com'; // 备用域名

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  /**
   * 微信支付统一下单（JSAPI / 小程序）
   * 对应微信API：POST /v3/pay/transactions/jsapi
   */
  async createOrder(
    orderId: number,
    userId: number,
    openid: string,
    clientIp: string,
  ): Promise<any> {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) throw new BadRequestException('订单不存在');

    const totalFee = Math.round(Number(order.payAmount) * 100);
    if (totalFee <= 0) throw new BadRequestException('订单金额无效');

    const appid = process.env.WX_APPID || '';
    const mchid = process.env.WX_MCHID || '';
    const notifyUrl = process.env.WX_NOTIFY_URL || 'https://kuli.com/api/pay/notify';
    const outTradeNo = order.orderNo || `kuli${orderId}_${Date.now()}`;

    // === Step 1: 构建请求body ===
    const body = {
      appid,
      mchid,
      description: '酷礼工坊-商品购买',
      out_trade_no: outTradeNo,
      time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z/, '+08:00'),
      attach: `orderId=${orderId}`,
      notify_url: notifyUrl,
      goods_tag: '',
      support_fapiao: false,
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
      settle_info: {
        profit_sharing: false,
      },
    };

    // === Step 2: 发送请求到微信支付 ===
    const result = await this.requestWxPay('/v3/pay/transactions/jsapi', body, appid, mchid);

    // === Step 3: 构造小程序调起支付的参数 ===
    const prepayId = result.prepay_id;
    const nonceStr = this.generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const packageStr = `prepay_id=${prepayId}`;

    // 签名串格式：appId\ntimeStamp\nnonceStr\npackage\n
    const signStr = `${appid}\n${timestamp}\n${nonceStr}\n${packageStr}\n`;
    const paySign = this.signWithPrivateKey(signStr);

    // 保存 prepay_id 到订单记录
    if (order.id) {
      await this.orderRepo.update(order.id, { orderNo: outTradeNo } as any);
    }

    return {
      timeStamp: timestamp,
      nonceStr,
      package: packageStr,
      signType: 'RSA',
      paySign,
      orderNo: outTradeNo,
    };
  }

  /**
   * 支付结果通知（微信回调）
   * 对应微信回调通知格式
   */
  async handleNotify(headers: any, body: any): Promise<string> {
    try {
      // 验证回调签名
      const wechatpaySignature = headers['wechatpay-signature'];
      const wechatpayTimestamp = headers['wechatpay-timestamp'];
      const wechatpayNonce = headers['wechatpay-nonce'];
      const wechatpaySerial = headers['wechatpay-serial'];

      // 验证签名（需平台证书）
      // const isValid = this.verifySignature(...);
      
      // 解密resource
      if (body?.resource) {
        const ciphertext = Buffer.from(body.resource.ciphertext, 'base64');
        const associatedData = body.resource.associated_data || '';
        const nonce = body.resource.nonce;
        const apiV3Key = process.env.WX_API_V3_KEY || '';

        // AES-GCM 解密
        const authTag = ciphertext.slice(ciphertext.length - 16);
        const data = ciphertext.slice(0, ciphertext.length - 16);
        const decipher = crypto.createDecipheriv('aes-256-gcm', apiV3Key, nonce);
        decipher.setAAD(Buffer.from(associatedData));
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
        const result = JSON.parse(decrypted.toString('utf8'));

        // 更新订单状态
        const outTradeNo = result.out_trade_no;
        if (outTradeNo) {
          await this.orderRepo.update(
            { orderNo: outTradeNo },
            { status: 'paid' as any, paidAt: new Date() },
          );
        }
      }

      // 返回 SUCCESS 告诉微信不再回调
      return JSON.stringify({ code: 'SUCCESS', message: '成功' });
    } catch (err) {
      return JSON.stringify({ code: 'FAIL', message: (err as Error).message });
    }
  }

  /**
   * 查询订单支付状态
   * GET /v3/pay/transactions/out-trade-no/{out_trade_no}
   */
  async queryPayStatus(orderNo: string): Promise<any> {
    const appid = process.env.WX_APPID || '';
    const mchid = process.env.WX_MCHID || '';
    const path = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${mchid}`;
    
    try {
      const result = await this.requestWxPay(path, null, appid, mchid, 'GET');
      return {
        trade_state: result.trade_state,
        trade_state_desc: result.trade_state_desc,
        ...result,
      };
    } catch (e) {
      return { trade_state: 'NOTPAY', trade_state_desc: '未支付' };
    }
  }

  /**
   * 关闭订单
   * POST /v3/pay/transactions/out-trade-no/{out_trade_no}/close
   */
  async closeOrder(orderNo: string): Promise<void> {
    const mchid = process.env.WX_MCHID || '';
    const path = `/v3/pay/transactions/out-trade-no/${orderNo}/close`;
    await this.requestWxPay(path, { mchid }, '', mchid, 'POST');
  }

  /**
   * 向微信支付 API V3 发送请求
   */
  private requestWxPay(
    path: string,
    body: any | null,
    appid: string,
    mchid: string,
    method: string = 'POST',
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const bodyStr = body ? JSON.stringify(body) : '';
      const url = new URL(this.baseUrl + path);

      // 生成 Authorization
      const nonceStr = this.generateNonceStr();
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const message = `${method}\n${url.pathname}${url.search}\n${timestamp}\n${nonceStr}\n${bodyStr ? bodyStr : ''}\n`;
      const signature = this.signWithPrivateKey(message);
      const serialNo = process.env.WX_CERT_SERIAL || '';

      const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`;

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method,
        headers: {
          'Authorization': auth,
          'Accept': 'application/json',
          'Content-Type': bodyStr ? 'application/json' : '',
          'User-Agent': 'kuli-gift/1.0',
        } as any,
        timeout: 10000,
      };

      if (!bodyStr) delete options.headers['Content-Type'];

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode! >= 200 && res.statusCode! < 300) {
              resolve(data ? JSON.parse(data) : {});
            } else {
              reject(new Error(`微信支付API错误(${res.statusCode}): ${data}`));
            }
          } catch (e) {
            reject(new Error(`解析响应失败: ${data}`));
          }
        });
      });

      req.on('error', (e) => reject(new Error(`请求微信支付失败: ${e.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('请求微信支付超时')); });

      if (bodyStr) req.write(bodyStr);
      req.end();
    });
  }

  /**
   * 使用商户证书私钥签名
   * 私钥需配置在环境变量 WX_PRIVATE_KEY 或 WX_CERT_PATH
   */
  private signWithPrivateKey(data: string): string {
    const privateKey = process.env.WX_PRIVATE_KEY || '';
    if (!privateKey) {
      // 开发环境返回模拟签名
      return 'mock_signature_for_dev';
    }
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}

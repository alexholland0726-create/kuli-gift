import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

interface LoginPayload {
  code?: string;
  openid?: string;
  nickname?: string;
  avatar?: string;
}

interface WechatSession {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(payload: LoginPayload, userInfo?: { nickname?: string; avatar?: string }): Promise<{ token: string; user: User }> {
    const openid = await this.resolveOpenid(payload);
    let user = await this.userService.findByOpenid(openid);
    if (!user) {
      user = await this.userService.create({
        openid,
        nickname: userInfo?.nickname || '微信用户',
        avatar: userInfo?.avatar || '',
      });
    }
    const token = this.jwtService.sign({ id: user.id, openid: user.openid });
    return { token, user };
  }

  async getUser(id: number): Promise<User> {
    return this.userService.findById(id);
  }

  private async resolveOpenid(payload: LoginPayload): Promise<string> {
    if (payload.openid && this.isDevMode()) {
      return payload.openid;
    }

    if (!payload.code) {
      throw new BadRequestException('微信登录 code 不能为空');
    }

    if (this.isDevMode() && payload.code.startsWith('mock_')) {
      return payload.code;
    }

    return this.exchangeCodeForOpenid(payload.code);
  }

  private async exchangeCodeForOpenid(code: string): Promise<string> {
    const appid = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');
    if (!appid || !secret) {
      throw new BadRequestException('微信登录参数未配置');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    const response = await fetch(url);
    const data = await response.json() as WechatSession;

    if (!response.ok || !data.openid) {
      throw new UnauthorizedException(data.errmsg || '微信登录失败');
    }

    return data.openid;
  }

  private isDevMode(): boolean {
    return this.configService.get('NODE_ENV') !== 'production';
  }
}

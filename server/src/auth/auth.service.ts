import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(openid: string, userInfo?: { nickname?: string; avatar?: string }): Promise<{ token: string; user: User }> {
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
}

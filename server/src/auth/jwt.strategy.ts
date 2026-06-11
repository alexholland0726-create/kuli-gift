import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private static getJwtSecret(configService: ConfigService): string {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }
    return secret;
  }

  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtStrategy.getJwtSecret(configService),
    });
  }

  async validate(payload: { id: number }) {
    const user = await this.userService.findById(payload.id);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, openid: user.openid };
  }
}

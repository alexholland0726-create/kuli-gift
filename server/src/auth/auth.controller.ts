import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  login(@Body() body: { openid: string; nickname?: string; avatar?: string }) {
    return this.service.login(body.openid, { nickname: body.nickname, avatar: body.avatar });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user')
  getUser(@Req() req) {
    return this.service.getUser(req.user.id);
  }
}

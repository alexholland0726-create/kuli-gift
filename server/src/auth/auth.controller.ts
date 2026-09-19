import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { WechatLoginDto } from './login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  login(@Body() body: WechatLoginDto) {
    return this.service.login({ code: body.code });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user')
  getUser(@Req() req) {
    return this.service.getUser(req.user.id);
  }
}

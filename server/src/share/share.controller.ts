import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ShareService } from './share.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/share')
export class ShareController {
  constructor(private service: ShareService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('record')
  recordShare(@Req() req, @Body() body: { productId: number }) {
    return this.service.recordShare(req.user.id, body.productId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  getStats(@Req() req) {
    return this.service.getShareStats(req.user.id);
  }
}

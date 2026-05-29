import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { GrouponService } from './groupon.service';

@Controller('api/groupon')
export class GrouponController {
  constructor(private readonly grouponService: GrouponService) {}

  @Get('activities')
  async getActivities() {
    return this.grouponService.getActiveActivities();
  }

  @Post(':activityId/create')
  async createGroup(@Param('activityId') activityId: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.grouponService.createGroup(Number(activityId), userId);
  }

  @Post(':activityId/join/:groupId')
  async joinGroup(
    @Param('activityId') activityId: string,
    @Param('groupId') groupId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 1;
    return this.grouponService.joinGroup(Number(activityId), Number(groupId), userId);
  }

  @Post(':id/pay-success')
  async paySuccess(@Param('id') id: string) {
    return this.grouponService.onPaySuccess(Number(id));
  }

  @Get(':activityId/progress/:groupId')
  async getProgress(
    @Param('activityId') activityId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.grouponService.getGroupProgress(Number(activityId), Number(groupId));
  }
}

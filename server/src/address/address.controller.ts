import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { AddressService } from './address.service';

@Controller('api/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user?.id || 1;
    return this.addressService.findByUser(userId);
  }

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.addressService.create(userId, data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.addressService.update(Number(id), userId, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.addressService.remove(Number(id), userId);
  }
}

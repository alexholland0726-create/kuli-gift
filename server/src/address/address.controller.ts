import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddressService } from './address.service';
import { AddressDto } from './address.dto';

@Controller('api/addresses')
@UseGuards(AuthGuard('jwt'))
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user.id;
    return this.addressService.findByUser(userId);
  }

  @Post()
  async create(@Body() data: AddressDto, @Req() req: any) {
    const userId = req.user.id;
    return this.addressService.create(userId, data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: AddressDto, @Req() req: any) {
    const userId = req.user.id;
    return this.addressService.update(Number(id), userId, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.addressService.remove(Number(id), userId);
  }
}

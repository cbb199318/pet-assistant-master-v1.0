import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShopService } from './shop.service';

@Controller('api/shop')
@UseGuards(AuthGuard('jwt'))
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  async getProducts(
    @Query('limit') limit: string = '20',
    @Query('keyword') keyword: string = '',
  ) {
    return this.shopService.getProducts(Number(limit) || 20, keyword);
  }

  @Get('products/recommended')
  async getRecommendedProducts(@Query('limit') limit: string = '6') {
    return this.shopService.getRecommendedProducts(Number(limit) || 6);
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
    return this.shopService.getProductById(Number(id));
  }

  @Get('addresses')
  async getAddresses(@Req() req) {
    return this.shopService.getAddresses(req.user.userId);
  }

  @Post('addresses')
  async createAddress(
    @Req() req,
    @Body()
    body: {
      receiver_name: string;
      receiver_phone: string;
      receiver_address: string;
      is_default?: boolean;
    },
  ) {
    return this.shopService.createAddress(req.user.userId, body);
  }

  @Put('addresses/:id')
  async updateAddress(
    @Req() req,
    @Param('id') id: string,
    @Body()
    body: {
      receiver_name?: string;
      receiver_phone?: string;
      receiver_address?: string;
      is_default?: boolean;
    },
  ) {
    return this.shopService.updateAddress(req.user.userId, Number(id), body);
  }

  @Delete('addresses/:id')
  async deleteAddress(@Req() req, @Param('id') id: string) {
    return this.shopService.deleteAddress(req.user.userId, Number(id));
  }

  @Post('orders')
  async createOrder(
    @Req() req,
    @Body()
    body: {
      addressId: number;
      remark?: string;
      items: Array<{
        productId: number;
        skuId: number;
        quantity: number;
      }>;
    },
  ) {
    return this.shopService.createOrder(req.user.userId, body);
  }

  @Get('orders')
  async getOrders(@Req() req) {
    return this.shopService.getOrders(req.user.userId);
  }

  @Get('orders/:id')
  async getOrderById(@Req() req, @Param('id') id: string) {
    return this.shopService.getOrderById(req.user.userId, Number(id));
  }

  @Put('orders/:id/cancel')
  async cancelOrder(@Req() req, @Param('id') id: string) {
    return this.shopService.cancelOrder(req.user.userId, Number(id));
  }

  @Put('orders/:id/pay')
  async payOrder(@Req() req, @Param('id') id: string) {
    return this.shopService.payOrder(req.user.userId, Number(id));
  }
}

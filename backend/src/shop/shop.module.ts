import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { Product } from './product.entity';
import { ProductSku } from './product-sku.entity';
import { UserAddress } from './user-address.entity';
import { ShopOrder } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Merchant } from './merchant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Merchant,
      Product,
      ProductSku,
      UserAddress,
      ShopOrder,
      OrderItem,
    ]),
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [ShopService],
})
export class ShopModule {}

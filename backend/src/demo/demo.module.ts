import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoSeedService } from './demo-seed.service';
import { User } from '../users/user.entity';
import { Pet } from '../pets/pet.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';
import { Post } from '../community/post.entity';
import { Comment } from '../community/comment.entity';
import { Booking } from '../community/booking.entity';
import { Category } from '../knowledge/category.entity';
import { Article } from '../knowledge/article.entity';
import { Merchant } from '../shop/merchant.entity';
import { Product } from '../shop/product.entity';
import { ProductSku } from '../shop/product-sku.entity';
import { UserAddress } from '../shop/user-address.entity';
import { ShopOrder } from '../shop/order.entity';
import { OrderItem } from '../shop/order-item.entity';
import { AdminUser } from '../admin/admin-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Pet,
      Vaccination,
      Deworming,
      Checkup,
      Care,
      Post,
      Comment,
      Booking,
      Category,
      Article,
      Merchant,
      Product,
      ProductSku,
      UserAddress,
      ShopOrder,
      OrderItem,
      AdminUser,
    ]),
  ],
  providers: [DemoSeedService],
  exports: [DemoSeedService],
})
export class DemoModule {}

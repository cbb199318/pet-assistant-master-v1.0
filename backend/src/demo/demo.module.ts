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
    ]),
  ],
  providers: [DemoSeedService],
  exports: [DemoSeedService],
})
export class DemoModule {}

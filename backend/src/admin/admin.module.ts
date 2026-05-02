import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminUser } from './admin-user.entity';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { User } from '../users/user.entity';
import { Pet } from '../pets/pet.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';
import { Post } from '../community/post.entity';
import { Comment } from '../community/comment.entity';
import { Booking } from '../community/booking.entity';
import { Article } from '../knowledge/article.entity';
import { Category } from '../knowledge/category.entity';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      User,
      Pet,
      Vaccination,
      Deworming,
      Checkup,
      Care,
      Post,
      Comment,
      Booking,
      Article,
      Category,
    ]),
    PassportModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AdminService, AdminAuthService, AdminJwtStrategy],
  controllers: [AdminController, AdminAuthController],
  exports: [AdminService, AdminAuthService],
})
export class AdminModule {}

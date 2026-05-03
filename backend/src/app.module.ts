import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { PetModule } from './pets/pet.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CareModule } from './care/care.module';
import { AiModule } from './ai/ai.module';
import { CommunityModule } from './community/community.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AdminModule } from './admin/admin.module';
import { DemoModule } from './demo/demo.module';
import { AdminUser } from './admin/admin-user.entity';
import { AdminAuditLog } from './admin/admin-audit-log.entity';
import { SystemSetting } from './admin/system-setting.entity';
import { AiConversation } from './ai/ai-conversation.entity';
import { User } from './users/user.entity';
import { Pet } from './pets/pet.entity';
import { Vaccination } from './health/vaccination.entity';
import { Deworming } from './health/deworming.entity';
import { Checkup } from './health/checkup.entity';
import { Care } from './care/care.entity';
import { Post } from './community/post.entity';
import { Comment } from './community/comment.entity';
import { Booking } from './community/booking.entity';
import { Article } from './knowledge/article.entity';
import { Category } from './knowledge/category.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const entities = [
  AdminUser,
  AdminAuditLog,
  SystemSetting,
  AiConversation,
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
];

const databaseType = process.env.DB_TYPE || 'sqljs';
const synchronize = (process.env.DB_SYNCHRONIZE || 'true').toLowerCase() === 'true';
const logging = (process.env.DB_LOGGING || 'false').toLowerCase() === 'true';
const databaseConfig =
  databaseType === 'mysql'
    ? {
        type: 'mysql' as const,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME || 'pet_assistant',
        charset: process.env.DB_CHARSET || 'utf8mb4',
        entities,
        synchronize,
        logging,
      }
    : {
        type: 'sqljs' as const,
        autoSave: true,
        location: process.env.SQLJS_LOCATION || 'pet-assistant.sqlite',
        entities,
        synchronize,
        logging,
      };

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UserModule,
    PetModule,
    HealthModule,
    CareModule,
    AiModule,
    CommunityModule,
    KnowledgeModule,
    AdminModule,
    DemoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

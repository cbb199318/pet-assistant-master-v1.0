import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vaccination } from './vaccination.entity';
import { Deworming } from './deworming.entity';
import { Checkup } from './checkup.entity';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PetModule } from '../pets/pet.module';
import { QwenVisionProvider } from '../ai/providers/qwen-vision.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vaccination, Deworming, Checkup]),
    PetModule,
  ],
  providers: [HealthService, QwenVisionProvider],
  controllers: [HealthController],
  exports: [HealthService],
})
export class HealthModule {}

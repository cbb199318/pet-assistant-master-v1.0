import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Care } from './care.entity';
import { CareService } from './care.service';
import { CareController } from './care.controller';
import { PetModule } from '../pets/pet.module';

@Module({
  imports: [TypeOrmModule.forFeature([Care]), PetModule],
  providers: [CareService],
  controllers: [CareController],
  exports: [CareService],
})
export class CareModule {}

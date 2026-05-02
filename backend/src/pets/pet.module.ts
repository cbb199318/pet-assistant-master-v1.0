import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './pet.entity';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, Vaccination, Deworming, Checkup, Care])],
  providers: [PetService],
  controllers: [PetController],
  exports: [PetService],
})
export class PetModule {}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Care } from './care.entity';
import { PetService } from '../pets/pet.service';

@Injectable()
export class CareService {
  constructor(
    @InjectRepository(Care) private careRepository: Repository<Care>,
    private petService: PetService,
  ) {}

  async createCare(
    user_id: number,
    careData: {
      type: string;
      description: string;
      date: Date;
      time?: string;
      duration?: number;
      quantity?: string;
      notes?: string;
      pet_id: number;
    },
  ): Promise<Care> {
    await this.petService.getPetById(careData.pet_id, user_id);

    const care = this.careRepository.create(careData);

    return this.careRepository.save(care);
  }

  async getCaresByPetId(pet_id: number, user_id: number): Promise<Care[]> {
    await this.petService.getPetById(pet_id, user_id);

    return this.careRepository.find({
      where: { pet_id },
      order: { date: 'DESC', created_at: 'DESC' },
    });
  }

  async getCareById(id: number, user_id: number): Promise<Care> {
    const care = await this.careRepository
      .createQueryBuilder('care')
      .leftJoinAndSelect('care.pet', 'pet')
      .where('care.id = :id', { id })
      .andWhere('pet.user_id = :userId', { userId: user_id })
      .getOne();

    if (!care) {
      throw new NotFoundException('Care record not found');
    }
    return care;
  }

  async updateCare(
    id: number,
    user_id: number,
    careData: {
      type?: string;
      description?: string;
      date?: Date;
      time?: string;
      duration?: number;
      quantity?: string;
      notes?: string;
    },
  ): Promise<Care> {
    const care = await this.getCareById(id, user_id);
    Object.assign(care, careData);
    return this.careRepository.save(care);
  }

  async deleteCare(id: number, user_id: number): Promise<void> {
    const care = await this.getCareById(id, user_id);
    await this.careRepository.remove(care);
  }

  async getCareStatistics(
    pet_id: number,
    user_id: number,
    days: number = 30,
  ): Promise<any> {
    await this.petService.getPetById(pet_id, user_id);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const cares = await this.careRepository.find({
      where: {
        pet_id,
        date: Between(startDate, endDate),
      },
    });

    const statistics = cares.reduce((acc, care) => {
      if (!acc[care.type]) {
        acc[care.type] = 0;
      }
      acc[care.type]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: `${days}天`,
      total: cares.length,
      statistics,
    };
  }
}

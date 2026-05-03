import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Care } from './care.entity';
import { PetService } from '../pets/pet.service';

@Injectable()
export class CareService {
  constructor(
    @InjectRepository(Care) private careRepository: Repository<Care>,
    private petService: PetService,
  ) {}

  private isSameDay(left?: Date | string | null, right?: Date | string | null) {
    if (!left || !right) {
      return false;
    }

    const leftDate = new Date(left);
    const rightDate = new Date(right);
    return leftDate.toISOString().slice(0, 10) === rightDate.toISOString().slice(0, 10);
  }

  private shouldPlanAppearToday(care: Care, today: Date) {
    if (care.mode !== 'plan' || care.is_completed) {
      return false;
    }

    const startDate = new Date(care.date);
    if (startDate > today) {
      return false;
    }

    const repeatPattern = care.repeat_pattern || 'daily';
    if (repeatPattern === 'weekdays') {
      const day = today.getDay();
      return day >= 1 && day <= 5;
    }
    if (repeatPattern === 'weekly') {
      return startDate.getDay() === today.getDay();
    }

    return true;
  }

  private async buildTodayPlans(cares: Care[]) {
    const today = new Date();

    return cares
      .filter((care) => this.shouldPlanAppearToday(care, today))
      .sort((left, right) =>
        String(left.reminder_time || left.time || '').localeCompare(
          String(right.reminder_time || right.time || ''),
        ),
      )
      .map((care) => ({
        ...care,
        completedToday: this.isSameDay(care.last_completed_at, today),
      }));
  }

  async createCare(
    user_id: number,
    careData: {
      type: string;
      description: string;
      mode?: 'record' | 'plan';
      date: Date;
      time?: string;
      reminder_time?: string;
      repeat_pattern?: 'daily' | 'weekdays' | 'weekly' | 'custom';
      duration?: number;
      quantity?: string;
      notes?: string;
      is_completed?: boolean;
      last_completed_at?: Date;
      source_plan_id?: number;
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

  async getTodayPlans(user_id: number, pet_id?: number) {
    if (pet_id) {
      await this.petService.getPetById(pet_id, user_id);
    }

    const petIds = pet_id
      ? [pet_id]
      : (await this.petService.getPetsByUserId(user_id)).map((pet) => pet.id);

    if (petIds.length === 0) {
      return [];
    }

    const plans = await this.careRepository.find({
      where: petIds.map((id) => ({ pet_id: id, mode: 'plan' })),
      order: { reminder_time: 'ASC', time: 'ASC', created_at: 'DESC' },
    });

    const pets = pet_id
      ? [await this.petService.getPetById(pet_id, user_id)]
      : await this.petService.getPetsByUserId(user_id);
    const petMap = new Map(pets.map((pet) => [pet.id, pet]));

    return (await this.buildTodayPlans(plans)).map((plan) => ({
      ...plan,
      pet: petMap.get(plan.pet_id) || null,
    }));
  }

  async completeTodayPlan(id: number, user_id: number) {
    const plan = await this.getCareById(id, user_id);
    if (plan.mode !== 'plan') {
      throw new NotFoundException('仅护理计划支持今日完成操作');
    }

    const now = new Date();
    if (!this.isSameDay(plan.last_completed_at, now)) {
      const completionRecord = this.careRepository.create({
        pet_id: plan.pet_id,
        type: plan.type,
        description: plan.description,
        mode: 'record',
        date: now,
        time: plan.time || now.toTimeString().slice(0, 8),
        duration: plan.duration,
        quantity: plan.quantity,
        notes: plan.notes,
        source_plan_id: plan.id,
      });
      await this.careRepository.save(completionRecord);
    }

    plan.last_completed_at = now;
    return this.careRepository.save(plan);
  }

  async getCareById(id: number, user_id: number): Promise<Care> {
    const care = await this.careRepository.findOne({ where: { id } });

    if (!care) {
      throw new NotFoundException('Care record not found');
    }

    care.pet = await this.petService.getPetById(care.pet_id, user_id);
    return care;
  }

  async updateCare(
    id: number,
    user_id: number,
    careData: {
      type?: string;
      description?: string;
      mode?: 'record' | 'plan';
      date?: Date;
      time?: string;
      reminder_time?: string;
      repeat_pattern?: 'daily' | 'weekdays' | 'weekly' | 'custom';
      duration?: number;
      quantity?: string;
      notes?: string;
      is_completed?: boolean;
      last_completed_at?: Date | null;
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

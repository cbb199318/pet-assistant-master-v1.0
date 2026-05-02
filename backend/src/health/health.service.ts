import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccination } from './vaccination.entity';
import { Deworming } from './deworming.entity';
import { Checkup } from './checkup.entity';
import { PetService } from '../pets/pet.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(Vaccination)
    private vaccinationRepository: Repository<Vaccination>,
    @InjectRepository(Deworming)
    private dewormingRepository: Repository<Deworming>,
    @InjectRepository(Checkup)
    private checkupRepository: Repository<Checkup>,
    private petService: PetService,
  ) {}

  // 疫苗接种记录
  async createVaccination(
    pet_id: number,
    user_id: number,
    vaccine_name: string,
    vaccination_date: Date,
    next_date?: Date,
    notes?: string,
  ) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const vaccination = this.vaccinationRepository.create({
      pet_id,
      vaccine_name,
      vaccination_date,
      next_date,
      notes,
    });

    return this.vaccinationRepository.save(vaccination);
  }

  async getVaccinationsByPetId(pet_id: number, user_id: number) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    return this.vaccinationRepository.find({ where: { pet_id } });
  }

  async updateVaccination(
    id: number,
    pet_id: number,
    user_id: number,
    updates: Partial<Vaccination>,
  ) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const vaccination = await this.vaccinationRepository.findOne({ where: { id, pet_id } });
    if (!vaccination) {
      throw new NotFoundException('疫苗接种记录不存在');
    }

    Object.assign(vaccination, updates);
    return this.vaccinationRepository.save(vaccination);
  }

  async deleteVaccination(id: number, pet_id: number, user_id: number) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const vaccination = await this.vaccinationRepository.findOne({ where: { id, pet_id } });
    if (!vaccination) {
      throw new NotFoundException('疫苗接种记录不存在');
    }

    return this.vaccinationRepository.remove(vaccination);
  }

  // 驱虫记录
  async createDeworming(
    pet_id: number,
    user_id: number,
    type: 'internal' | 'external' | 'both',
    product_name: string,
    deworming_date: Date,
    next_date?: Date,
    notes?: string,
  ) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const deworming = this.dewormingRepository.create({
      pet_id,
      type,
      product_name,
      deworming_date,
      next_date,
      notes,
    });

    return this.dewormingRepository.save(deworming);
  }

  async getDewormingsByPetId(pet_id: number, user_id: number) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    return this.dewormingRepository.find({ where: { pet_id } });
  }

  async updateDeworming(
    id: number,
    pet_id: number,
    user_id: number,
    updates: Partial<Deworming>,
  ) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const deworming = await this.dewormingRepository.findOne({ where: { id, pet_id } });
    if (!deworming) {
      throw new NotFoundException('驱虫记录不存在');
    }

    Object.assign(deworming, updates);
    return this.dewormingRepository.save(deworming);
  }

  async deleteDeworming(id: number, pet_id: number, user_id: number) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const deworming = await this.dewormingRepository.findOne({ where: { id, pet_id } });
    if (!deworming) {
      throw new NotFoundException('驱虫记录不存在');
    }

    return this.dewormingRepository.remove(deworming);
  }

  // 体检记录
  async createCheckup(
    pet_id: number,
    user_id: number,
    checkup_date: Date,
    hospital: string,
    doctor?: string,
    weight?: number,
    temperature?: number,
    diagnosis?: string,
    recommendations?: string,
  ) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const checkup = this.checkupRepository.create({
      pet_id,
      checkup_date,
      hospital,
      doctor,
      weight,
      temperature,
      diagnosis,
      recommendations,
    });

    return this.checkupRepository.save(checkup);
  }

  async getCheckupsByPetId(pet_id: number, user_id: number) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    return this.checkupRepository.find({ where: { pet_id } });
  }

  async updateCheckup(
    id: number,
    pet_id: number,
    user_id: number,
    updates: Partial<Checkup>,
  ) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const checkup = await this.checkupRepository.findOne({ where: { id, pet_id } });
    if (!checkup) {
      throw new NotFoundException('体检记录不存在');
    }

    Object.assign(checkup, updates);
    return this.checkupRepository.save(checkup);
  }

  async deleteCheckup(id: number, pet_id: number, user_id: number) {
    // 验证宠物是否属于该用户
    await this.petService.getPetById(pet_id, user_id);

    const checkup = await this.checkupRepository.findOne({ where: { id, pet_id } });
    if (!checkup) {
      throw new NotFoundException('体检记录不存在');
    }

    return this.checkupRepository.remove(checkup);
  }
}

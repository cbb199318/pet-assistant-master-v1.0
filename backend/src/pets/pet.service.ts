import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './pet.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';
import { Care } from '../care/care.entity';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(Vaccination)
    private vaccinationRepository: Repository<Vaccination>,
    @InjectRepository(Deworming)
    private dewormingRepository: Repository<Deworming>,
    @InjectRepository(Checkup)
    private checkupRepository: Repository<Checkup>,
    @InjectRepository(Care)
    private careRepository: Repository<Care>,
  ) {}

  async createPet(
    user_id: number,
    name: string,
    species: string,
    breed?: string,
    gender?: 'male' | 'female',
    birthday?: Date,
    sterilized: boolean = false,
    avatar?: string,
  ) {
    const pet = this.petRepository.create({
      user_id,
      name,
      species,
      breed,
      gender,
      birthday,
      sterilized,
      avatar,
    });

    return this.petRepository.save(pet);
  }

  async getPetsByUserId(user_id: number) {
    return this.petRepository.find({ where: { user_id } });
  }

  async getPetById(id: number, user_id: number) {
    const pet = await this.petRepository.findOne({ where: { id, user_id } });
    if (!pet) {
      throw new NotFoundException('宠物不存在');
    }
    return pet;
  }

  async updatePet(
    id: number,
    user_id: number,
    updates: Partial<Pet>,
  ) {
    const pet = await this.getPetById(id, user_id);
    Object.assign(pet, updates);
    return this.petRepository.save(pet);
  }

  async deletePet(id: number, user_id: number) {
    console.log('开始删除宠物:', { id, user_id });
    const pet = await this.getPetById(id, user_id);
    console.log('找到宠物:', pet);

    // 删除相关的疫苗接种记录
    console.log('删除相关的疫苗接种记录');
    const vaccinationResult = await this.vaccinationRepository.delete({ pet_id: id });
    console.log('疫苗接种记录删除结果:', vaccinationResult);
    
    // 删除相关的驱虫记录
    console.log('删除相关的驱虫记录');
    const dewormingResult = await this.dewormingRepository.delete({ pet_id: id });
    console.log('驱虫记录删除结果:', dewormingResult);
    
    // 删除相关的体检记录
    console.log('删除相关的体检记录');
    const checkupResult = await this.checkupRepository.delete({ pet_id: id });
    console.log('体检记录删除结果:', checkupResult);
    
    // 删除相关的护理记录（从care_records表中）
    console.log('删除相关的护理记录');
    const careResult = await this.careRepository.delete({ pet_id: id });
    console.log('护理记录删除结果:', careResult);

    // 删除宠物
    console.log('删除宠物');
    const petResult = await this.petRepository.remove(pet);
    console.log('宠物删除结果:', petResult);
    
    return petResult;
  }
}

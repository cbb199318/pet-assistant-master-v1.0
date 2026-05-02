import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccination } from './vaccination.entity';
import { Deworming } from './deworming.entity';
import { Checkup } from './checkup.entity';
import { PetService } from '../pets/pet.service';
import { QwenVisionProvider } from '../ai/providers/qwen-vision.provider';
import { HEALTH_PROVIDER_OPTIONS } from './health.providers';

type HealthRecordType = 'vaccination' | 'deworming' | 'checkup';

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
    private qwenVisionProvider: QwenVisionProvider,
  ) {}

  private buildOcrPrompt(recordType: HealthRecordType) {
    if (recordType === 'vaccination') {
      return [
        '请识别这张宠物疫苗本或疫苗接种记录，并仅输出 JSON。',
        '字段包含：vaccine_name, vaccination_date, next_date, hospital, doctor, notes。',
        '日期统一输出 YYYY-MM-DD，识别不到就返回空字符串。',
      ].join('');
    }
    if (recordType === 'deworming') {
      return [
        '请识别这张宠物驱虫记录，并仅输出 JSON。',
        '字段包含：product_name, type, deworming_date, next_date, hospital, doctor, notes。',
        'type 仅允许 internal / external / both，日期统一输出 YYYY-MM-DD。',
      ].join('');
    }
    return [
      '请识别这张宠物体检单或医院处方单，并仅输出 JSON。',
      '字段包含：hospital, checkup_date, doctor, weight, temperature, diagnosis, recommendations。',
      '日期统一输出 YYYY-MM-DD，数值字段仅输出数字或空字符串。',
    ].join('');
  }

  private extractJsonObject(text: string) {
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
    const rawText = codeBlockMatch?.[1] || text;
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return {};
    }

    const jsonText = rawText.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonText);
    } catch {
      return {};
    }
  }

  private normalizeOcrFields(recordType: HealthRecordType, fields: Record<string, any>) {
    const trim = (value: any) => (typeof value === 'string' ? value.trim() : value ?? '');

    if (recordType === 'vaccination') {
      return {
        vaccine_name: trim(fields.vaccine_name),
        vaccination_date: trim(fields.vaccination_date),
        next_date: trim(fields.next_date),
        hospital: trim(fields.hospital),
        doctor: trim(fields.doctor),
        notes: trim(fields.notes),
      };
    }

    if (recordType === 'deworming') {
      const normalizedType = ['internal', 'external', 'both'].includes(trim(fields.type))
        ? trim(fields.type)
        : 'internal';
      return {
        product_name: trim(fields.product_name),
        type: normalizedType,
        deworming_date: trim(fields.deworming_date),
        next_date: trim(fields.next_date),
        hospital: trim(fields.hospital),
        doctor: trim(fields.doctor),
        notes: trim(fields.notes),
      };
    }

    return {
      hospital: trim(fields.hospital),
      checkup_date: trim(fields.checkup_date),
      doctor: trim(fields.doctor),
      weight: trim(fields.weight),
      temperature: trim(fields.temperature),
      diagnosis: trim(fields.diagnosis),
      recommendations: trim(fields.recommendations),
    };
  }

  async getProviderOptions(keyword?: string) {
    const normalizedKeyword = keyword?.trim().toLowerCase();
    if (!normalizedKeyword) {
      return HEALTH_PROVIDER_OPTIONS;
    }

    return HEALTH_PROVIDER_OPTIONS.filter((item) =>
      [
        item.hospital,
        item.doctor,
        item.specialty,
        item.address,
      ].some((value) => value.toLowerCase().includes(normalizedKeyword)),
    );
  }

  async recognizeRecordFromImage(recordType: HealthRecordType, file: { mimetype: string; buffer: Buffer }) {
    if (!this.qwenVisionProvider.isConfigured()) {
      return {
        fields: this.normalizeOcrFields(recordType, {}),
        rawText: '',
        message: 'OCR 服务暂未配置，已为你保留图片上传能力，请手动补充识别结果。',
      };
    }

    const rawText = await this.qwenVisionProvider.analyzeImage(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      this.buildOcrPrompt(recordType),
    );

    return {
      fields: this.normalizeOcrFields(recordType, this.extractJsonObject(rawText)),
      rawText,
      message: '识别完成，请确认并修正后保存。',
    };
  }

  async createVaccination(
    pet_id: number,
    user_id: number,
    vaccine_name: string,
    vaccination_date: Date,
    next_date?: Date,
    hospital?: string,
    doctor?: string,
    record_image_url?: string,
    notes?: string,
  ) {
    await this.petService.getPetById(pet_id, user_id);

    const vaccination = this.vaccinationRepository.create({
      pet_id,
      vaccine_name,
      vaccination_date,
      next_date,
      hospital,
      doctor,
      record_image_url,
      notes,
    });

    return this.vaccinationRepository.save(vaccination);
  }

  async getVaccinationsByPetId(pet_id: number, user_id: number) {
    await this.petService.getPetById(pet_id, user_id);
    return this.vaccinationRepository.find({
      where: { pet_id },
      order: { vaccination_date: 'DESC', id: 'DESC' },
    });
  }

  async updateVaccination(
    id: number,
    pet_id: number,
    user_id: number,
    updates: Partial<Vaccination>,
  ) {
    await this.petService.getPetById(pet_id, user_id);
    const vaccination = await this.vaccinationRepository.findOne({ where: { id, pet_id } });
    if (!vaccination) {
      throw new NotFoundException('疫苗接种记录不存在');
    }

    Object.assign(vaccination, updates);
    return this.vaccinationRepository.save(vaccination);
  }

  async deleteVaccination(id: number, pet_id: number, user_id: number) {
    await this.petService.getPetById(pet_id, user_id);
    const vaccination = await this.vaccinationRepository.findOne({ where: { id, pet_id } });
    if (!vaccination) {
      throw new NotFoundException('疫苗接种记录不存在');
    }

    return this.vaccinationRepository.remove(vaccination);
  }

  async createDeworming(
    pet_id: number,
    user_id: number,
    type: 'internal' | 'external' | 'both',
    product_name: string,
    deworming_date: Date,
    next_date?: Date,
    hospital?: string,
    doctor?: string,
    record_image_url?: string,
    notes?: string,
  ) {
    await this.petService.getPetById(pet_id, user_id);

    const deworming = this.dewormingRepository.create({
      pet_id,
      type,
      product_name,
      deworming_date,
      next_date,
      hospital,
      doctor,
      record_image_url,
      notes,
    });

    return this.dewormingRepository.save(deworming);
  }

  async getDewormingsByPetId(pet_id: number, user_id: number) {
    await this.petService.getPetById(pet_id, user_id);

    return this.dewormingRepository.find({
      where: { pet_id },
      order: { deworming_date: 'DESC', id: 'DESC' },
    });
  }

  async updateDeworming(
    id: number,
    pet_id: number,
    user_id: number,
    updates: Partial<Deworming>,
  ) {
    await this.petService.getPetById(pet_id, user_id);

    const deworming = await this.dewormingRepository.findOne({ where: { id, pet_id } });
    if (!deworming) {
      throw new NotFoundException('驱虫记录不存在');
    }

    Object.assign(deworming, updates);
    return this.dewormingRepository.save(deworming);
  }

  async deleteDeworming(id: number, pet_id: number, user_id: number) {
    await this.petService.getPetById(pet_id, user_id);

    const deworming = await this.dewormingRepository.findOne({ where: { id, pet_id } });
    if (!deworming) {
      throw new NotFoundException('驱虫记录不存在');
    }

    return this.dewormingRepository.remove(deworming);
  }

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
    record_image_url?: string,
  ) {
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
      record_image_url,
    });

    return this.checkupRepository.save(checkup);
  }

  async getCheckupsByPetId(pet_id: number, user_id: number) {
    await this.petService.getPetById(pet_id, user_id);

    return this.checkupRepository.find({
      where: { pet_id },
      order: { checkup_date: 'DESC', id: 'DESC' },
    });
  }

  async updateCheckup(
    id: number,
    pet_id: number,
    user_id: number,
    updates: Partial<Checkup>,
  ) {
    await this.petService.getPetById(pet_id, user_id);

    const checkup = await this.checkupRepository.findOne({ where: { id, pet_id } });
    if (!checkup) {
      throw new NotFoundException('体检记录不存在');
    }

    Object.assign(checkup, updates);
    return this.checkupRepository.save(checkup);
  }

  async deleteCheckup(id: number, pet_id: number, user_id: number) {
    await this.petService.getPetById(pet_id, user_id);

    const checkup = await this.checkupRepository.findOne({ where: { id, pet_id } });
    if (!checkup) {
      throw new NotFoundException('体检记录不存在');
    }

    return this.checkupRepository.remove(checkup);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { HealthService } from './health.service';
import {
  HEALTH_UPLOAD_DIR,
  HEALTH_UPLOAD_LIMIT,
  HEALTH_UPLOAD_PUBLIC_PREFIX,
} from './health.constants';

class CreateVaccinationDto {
  pet_id: number;
  vaccine_name: string;
  vaccination_date: Date;
  next_date?: Date;
  hospital?: string;
  doctor?: string;
  record_image_url?: string;
  notes?: string;
}

class UpdateVaccinationDto {
  pet_id: number;
  vaccine_name?: string;
  vaccination_date?: Date;
  next_date?: Date;
  hospital?: string;
  doctor?: string;
  record_image_url?: string;
  notes?: string;
}

class CreateDewormingDto {
  pet_id: number;
  type: 'internal' | 'external' | 'both';
  product_name: string;
  deworming_date: Date;
  next_date?: Date;
  hospital?: string;
  doctor?: string;
  record_image_url?: string;
  notes?: string;
}

class UpdateDewormingDto {
  pet_id: number;
  type?: 'internal' | 'external' | 'both';
  product_name?: string;
  deworming_date?: Date;
  next_date?: Date;
  hospital?: string;
  doctor?: string;
  record_image_url?: string;
  notes?: string;
}

class CreateCheckupDto {
  pet_id: number;
  checkup_date: Date;
  hospital: string;
  doctor?: string;
  weight?: number;
  temperature?: number;
  diagnosis?: string;
  recommendations?: string;
  record_image_url?: string;
}

class UpdateCheckupDto {
  pet_id: number;
  checkup_date?: Date;
  hospital?: string;
  doctor?: string;
  weight?: number;
  temperature?: number;
  diagnosis?: string;
  recommendations?: string;
  record_image_url?: string;
}

@Controller('api/health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  private saveUploadedFile(file: { originalname: string; buffer: Buffer }) {
    mkdirSync(HEALTH_UPLOAD_DIR, { recursive: true });
    const filename = `health-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extname(file.originalname || '.jpg') || '.jpg'}`;
    writeFileSync(`${HEALTH_UPLOAD_DIR}/${filename}`, file.buffer);
    return `${HEALTH_UPLOAD_PUBLIC_PREFIX}/${filename}`;
  }

  @Get('provider-options')
  @UseGuards(AuthGuard('jwt'))
  async getProviderOptions(@Query('keyword') keyword?: string) {
    return this.healthService.getProviderOptions(keyword);
  }

  @Post('upload-record-image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: HEALTH_UPLOAD_LIMIT,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new BadRequestException('仅支持上传图片文件'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadRecordImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }

    return {
      url: this.saveUploadedFile(file),
    };
  }

  @Post('ocr')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: HEALTH_UPLOAD_LIMIT,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new BadRequestException('仅支持上传图片文件'), false);
        }
        callback(null, true);
      },
    }),
  )
  async recognizeRecordImage(
    @UploadedFile() file: any,
    @Body('recordType') recordType: 'vaccination' | 'deworming' | 'checkup',
  ) {
    if (!file) {
      throw new BadRequestException('请上传图片文件');
    }
    if (!['vaccination', 'deworming', 'checkup'].includes(recordType)) {
      throw new BadRequestException('recordType 不正确');
    }

    const imageUrl = this.saveUploadedFile(file);
    const result = await this.healthService.recognizeRecordFromImage(recordType, file);

    return {
      ...result,
      imageUrl,
    };
  }

  @Post('vaccinations')
  @UseGuards(AuthGuard('jwt'))
  async createVaccination(@Request() req, @Body(ValidationPipe) body: CreateVaccinationDto) {
    const user_id = req.user.userId;
    return this.healthService.createVaccination(
      body.pet_id,
      user_id,
      body.vaccine_name,
      body.vaccination_date,
      body.next_date,
      body.hospital,
      body.doctor,
      body.record_image_url,
      body.notes,
    );
  }

  @Get('vaccinations/:pet_id')
  @UseGuards(AuthGuard('jwt'))
  async getVaccinations(@Request() req, @Param('pet_id') pet_id: number) {
    const user_id = req.user.userId;
    return this.healthService.getVaccinationsByPetId(pet_id, user_id);
  }

  @Put('vaccinations/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateVaccination(
    @Request() req,
    @Param('id') id: number,
    @Body(ValidationPipe) body: UpdateVaccinationDto,
  ) {
    const user_id = req.user.userId;
    return this.healthService.updateVaccination(id, body.pet_id, user_id, body);
  }

  @Delete('vaccinations/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteVaccination(
    @Request() req,
    @Param('id') id: number,
    @Body('pet_id') pet_id: number,
  ) {
    const user_id = req.user.userId;
    return this.healthService.deleteVaccination(id, pet_id, user_id);
  }

  @Post('dewormings')
  @UseGuards(AuthGuard('jwt'))
  async createDeworming(@Request() req, @Body(ValidationPipe) body: CreateDewormingDto) {
    const user_id = req.user.userId;
    return this.healthService.createDeworming(
      body.pet_id,
      user_id,
      body.type,
      body.product_name,
      body.deworming_date,
      body.next_date,
      body.hospital,
      body.doctor,
      body.record_image_url,
      body.notes,
    );
  }

  @Get('dewormings/:pet_id')
  @UseGuards(AuthGuard('jwt'))
  async getDewormings(@Request() req, @Param('pet_id') pet_id: number) {
    const user_id = req.user.userId;
    return this.healthService.getDewormingsByPetId(pet_id, user_id);
  }

  @Put('dewormings/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateDeworming(
    @Request() req,
    @Param('id') id: number,
    @Body(ValidationPipe) body: UpdateDewormingDto,
  ) {
    const user_id = req.user.userId;
    return this.healthService.updateDeworming(id, body.pet_id, user_id, body);
  }

  @Delete('dewormings/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteDeworming(
    @Request() req,
    @Param('id') id: number,
    @Body('pet_id') pet_id: number,
  ) {
    const user_id = req.user.userId;
    return this.healthService.deleteDeworming(id, pet_id, user_id);
  }

  @Post('checkups')
  @UseGuards(AuthGuard('jwt'))
  async createCheckup(@Request() req, @Body(ValidationPipe) body: CreateCheckupDto) {
    const user_id = req.user.userId;
    return this.healthService.createCheckup(
      body.pet_id,
      user_id,
      body.checkup_date,
      body.hospital,
      body.doctor,
      body.weight,
      body.temperature,
      body.diagnosis,
      body.recommendations,
      body.record_image_url,
    );
  }

  @Get('checkups/:pet_id')
  @UseGuards(AuthGuard('jwt'))
  async getCheckups(@Request() req, @Param('pet_id') pet_id: number) {
    const user_id = req.user.userId;
    return this.healthService.getCheckupsByPetId(pet_id, user_id);
  }

  @Put('checkups/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateCheckup(
    @Request() req,
    @Param('id') id: number,
    @Body(ValidationPipe) body: UpdateCheckupDto,
  ) {
    const user_id = req.user.userId;
    return this.healthService.updateCheckup(id, body.pet_id, user_id, body);
  }

  @Delete('checkups/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCheckup(
    @Request() req,
    @Param('id') id: number,
    @Body('pet_id') pet_id: number,
  ) {
    const user_id = req.user.userId;
    return this.healthService.deleteCheckup(id, pet_id, user_id);
  }
}

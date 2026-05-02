import { Controller, Post, Get, Put, Delete, Body, Param, Request, ValidationPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HealthService } from './health.service';

class CreateVaccinationDto {
  pet_id: number;
  vaccine_name: string;
  vaccination_date: Date;
  next_date?: Date;
  notes?: string;
}

class UpdateVaccinationDto {
  pet_id: number;
  vaccine_name?: string;
  vaccination_date?: Date;
  next_date?: Date;
  notes?: string;
}

class CreateDewormingDto {
  pet_id: number;
  type: 'internal' | 'external' | 'both';
  product_name: string;
  deworming_date: Date;
  next_date?: Date;
  notes?: string;
}

class UpdateDewormingDto {
  pet_id: number;
  type?: 'internal' | 'external' | 'both';
  product_name?: string;
  deworming_date?: Date;
  next_date?: Date;
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
}

@Controller('api/health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  // 疫苗接种记录
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
    @Body(ValidationPipe) body: UpdateVaccinationDto
  ) {
    const user_id = req.user.userId;
    return this.healthService.updateVaccination(id, body.pet_id, user_id, body);
  }

  @Delete('vaccinations/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteVaccination(
    @Request() req, 
    @Param('id') id: number, 
    @Body('pet_id') pet_id: number
  ) {
    const user_id = req.user.userId;
    return this.healthService.deleteVaccination(id, pet_id, user_id);
  }

  // 驱虫记录
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
    @Body(ValidationPipe) body: UpdateDewormingDto
  ) {
    const user_id = req.user.userId;
    return this.healthService.updateDeworming(id, body.pet_id, user_id, body);
  }

  @Delete('dewormings/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteDeworming(
    @Request() req, 
    @Param('id') id: number, 
    @Body('pet_id') pet_id: number
  ) {
    const user_id = req.user.userId;
    return this.healthService.deleteDeworming(id, pet_id, user_id);
  }

  // 体检记录
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
    @Body(ValidationPipe) body: UpdateCheckupDto
  ) {
    const user_id = req.user.userId;
    return this.healthService.updateCheckup(id, body.pet_id, user_id, body);
  }

  @Delete('checkups/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteCheckup(
    @Request() req, 
    @Param('id') id: number, 
    @Body('pet_id') pet_id: number
  ) {
    const user_id = req.user.userId;
    return this.healthService.deleteCheckup(id, pet_id, user_id);
  }
}

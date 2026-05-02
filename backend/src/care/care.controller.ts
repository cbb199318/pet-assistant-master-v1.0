import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CareService } from './care.service';
import { Care } from './care.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/care')
@UseGuards(AuthGuard('jwt'))
export class CareController {
  constructor(private careService: CareService) {}

  @Post()
  async createCare(@Request() req, @Body() careData: {
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
    pet_id: number;
  }): Promise<Care> {
    return this.careService.createCare(req.user.userId, careData);
  }

  @Get('pet/:pet_id')
  async getCaresByPetId(@Request() req, @Param('pet_id') pet_id: number): Promise<Care[]> {
    return this.careService.getCaresByPetId(Number(pet_id), req.user.userId);
  }

  @Get('today')
  async getTodayPlans(@Request() req, @Query('pet_id') pet_id?: string) {
    return this.careService.getTodayPlans(
      req.user.userId,
      pet_id ? Number(pet_id) : undefined,
    );
  }

  @Get(':id')
  async getCareById(@Request() req, @Param('id') id: number): Promise<Care> {
    return this.careService.getCareById(Number(id), req.user.userId);
  }

  @Put(':id')
  async updateCare(@Request() req, @Param('id') id: number, @Body() careData: {
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
  }): Promise<Care> {
    return this.careService.updateCare(Number(id), req.user.userId, careData);
  }

  @Delete(':id')
  async deleteCare(@Request() req, @Param('id') id: number): Promise<void> {
    return this.careService.deleteCare(Number(id), req.user.userId);
  }

  @Post(':id/complete-today')
  async completeTodayPlan(@Request() req, @Param('id') id: number) {
    return this.careService.completeTodayPlan(Number(id), req.user.userId);
  }

  @Get('statistics/:pet_id')
  async getCareStatistics(
    @Request() req,
    @Param('pet_id') pet_id: number,
    @Query('days') days: string = '30',
  ): Promise<any> {
    return this.careService.getCareStatistics(Number(pet_id), req.user.userId, Number(days) || 30);
  }
}

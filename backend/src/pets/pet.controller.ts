import { Controller, Post, Get, Put, Delete, Body, Param, Request, ValidationPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PetService } from './pet.service';

class CreatePetDto {
  name: string;
  species: string;
  breed?: string;
  gender?: 'male' | 'female';
  birthday?: Date;
  sterilized?: boolean;
  avatar?: string;
}

class UpdatePetDto {
  name?: string;
  species?: string;
  breed?: string;
  gender?: 'male' | 'female';
  birthday?: Date;
  sterilized?: boolean;
  avatar?: string;
}

@Controller('api/pets')
export class PetController {
  constructor(private petService: PetService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createPet(@Request() req, @Body(ValidationPipe) body: CreatePetDto) {
    const user_id = req.user.userId;
    return this.petService.createPet(
      user_id,
      body.name,
      body.species,
      body.breed,
      body.gender,
      body.birthday,
      body.sterilized,
      body.avatar,
    );
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getPets(@Request() req) {
    const user_id = req.user.userId;
    return this.petService.getPetsByUserId(user_id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getPet(@Request() req, @Param('id') id: number) {
    const user_id = req.user.userId;
    return this.petService.getPetById(id, user_id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updatePet(@Request() req, @Param('id') id: number, @Body(ValidationPipe) body: UpdatePetDto) {
    const user_id = req.user.userId;
    return this.petService.updatePet(id, user_id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deletePet(@Request() req, @Param('id') id: number) {
    console.log('删除宠物请求到达:', { id, user_id: req.user.userId });
    const user_id = req.user.userId;
    try {
      const result = await this.petService.deletePet(id, user_id);
      console.log('删除宠物成功:', result);
      return result;
    } catch (error) {
      console.error('删除宠物失败:', error);
      throw error;
    }
  }
}

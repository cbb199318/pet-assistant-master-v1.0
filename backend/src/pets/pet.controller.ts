import { BadRequestException, Controller, Post, Get, Put, Delete, Body, Param, Request, UploadedFile, ValidationPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync, writeFileSync } from 'fs';
import { extname } from 'path';
import { PetService } from './pet.service';
import { PROFILE_UPLOAD_DIR, PROFILE_UPLOAD_LIMIT, PROFILE_UPLOAD_PUBLIC_PREFIX } from '../uploads/upload.constants';

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

  private saveAvatar(file: { originalname: string; buffer: Buffer }) {
    mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });
    const filename = `pet-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extname(file.originalname || '.jpg') || '.jpg'}`;
    writeFileSync(`${PROFILE_UPLOAD_DIR}/${filename}`, file.buffer);
    return `${PROFILE_UPLOAD_PUBLIC_PREFIX}/${filename}`;
  }

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
    const user_id = req.user.userId;
    return this.petService.deletePet(id, user_id);
  }

  @Post('avatar-upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: PROFILE_UPLOAD_LIMIT,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new BadRequestException('仅支持上传图片文件'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('请上传宠物头像');
    }
    return {
      url: this.saveAvatar(file),
    };
  }
}

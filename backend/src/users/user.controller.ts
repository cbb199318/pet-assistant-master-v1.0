import { BadRequestException, Controller, Post, Body, ValidationPipe, Put, Get, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync, writeFileSync } from 'fs';
import { extname } from 'path';
import { PROFILE_UPLOAD_DIR, PROFILE_UPLOAD_LIMIT, PROFILE_UPLOAD_PUBLIC_PREFIX } from '../uploads/upload.constants';

class RegisterDto {
  phone: string;
  password: string;
  nickname: string;
}

class LoginDto {
  phone: string;
  password: string;
}

class UpdateUserDto {
  nickname: string;
  avatar: string;
}

class ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

class BindEmailDto {
  email: string;
}

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  private saveAvatar(file: { originalname: string; buffer: Buffer }) {
    mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });
    const filename = `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extname(file.originalname || '.jpg') || '.jpg'}`;
    writeFileSync(`${PROFILE_UPLOAD_DIR}/${filename}`, file.buffer);
    return `${PROFILE_UPLOAD_PUBLIC_PREFIX}/${filename}`;
  }

  @Post('register')
  async register(@Body(ValidationPipe) body: RegisterDto) {
    return this.userService.register(body.phone, body.password, body.nickname);
  }

  @Post('login')
  async login(@Body(ValidationPipe) body: LoginDto) {
    return this.userService.login(body.phone, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('update')
  async updateUser(@Req() req, @Body(ValidationPipe) body: UpdateUserDto) {
    return this.userService.updateUser(req.user.userId, body.nickname, body.avatar);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('change-password')
  async changePassword(@Req() req, @Body(ValidationPipe) body: ChangePasswordDto) {
    return this.userService.changePassword(req.user.userId, body.oldPassword, body.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('bind-email')
  async bindEmail(@Req() req, @Body(ValidationPipe) body: BindEmailDto) {
    return this.userService.bindEmail(req.user.userId, body.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('avatar-upload')
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
      throw new BadRequestException('请上传头像图片');
    }
    return {
      url: this.saveAvatar(file),
    };
  }
}

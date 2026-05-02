import { Controller, Post, Body, ValidationPipe, Put, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

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
}

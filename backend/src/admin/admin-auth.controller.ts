import { Body, Controller, Get, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtGuard } from './admin-jwt.guard';

class AdminLoginDto {
  username: string;
  password: string;
}

@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body(ValidationPipe) body: AdminLoginDto) {
    return this.adminAuthService.login(body.username, body.password);
  }

  @Get('profile')
  @UseGuards(AdminJwtGuard)
  async getProfile(@Req() req) {
    return this.adminAuthService.getProfile(req.user.adminId);
  }
}

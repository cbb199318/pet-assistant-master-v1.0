import {
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from './admin-user.entity';

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
  }

  private getDefaultAdminCredentials() {
    return {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
    };
  }

  private toProfile(adminUser: AdminUser) {
    return {
      id: adminUser.id,
      username: adminUser.username,
      status: adminUser.status,
      last_login_at: adminUser.last_login_at,
      created_at: adminUser.created_at,
    };
  }

  private signToken(adminUser: AdminUser) {
    return this.jwtService.sign({
      adminId: adminUser.id,
      username: adminUser.username,
      type: 'admin',
    });
  }

  async ensureDefaultAdmin() {
    const { username, password } = this.getDefaultAdminCredentials();
    const existingAdmin = await this.adminUserRepository.findOne({
      where: { username },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!existingAdmin) {
      const adminUser = this.adminUserRepository.create({
        username,
        password: hashedPassword,
        status: 'active',
      });
      await this.adminUserRepository.save(adminUser);
      return;
    }

    existingAdmin.password = hashedPassword;
    existingAdmin.status = 'active';
    await this.adminUserRepository.save(existingAdmin);
  }

  async login(username: string, password: string) {
    const adminUser = await this.adminUserRepository.findOne({
      where: { username },
    });

    if (!adminUser) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    if (adminUser.status !== 'active') {
      throw new ConflictException('管理员账号已停用');
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    adminUser.last_login_at = new Date();
    await this.adminUserRepository.save(adminUser);

    return {
      admin: this.toProfile(adminUser),
      token: this.signToken(adminUser),
    };
  }

  async getProfile(adminId: number) {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminId },
    });

    if (!adminUser) {
      throw new UnauthorizedException('管理员账号不存在');
    }

    return {
      admin: this.toProfile(adminUser),
    };
  }
}

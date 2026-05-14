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
import { AdminAuditLog } from './admin-audit-log.entity';
import { AdminUser } from './admin-user.entity';
import { AdminRole, getAdminPermissions, getRoleLabel } from './admin-permissions';

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    @InjectRepository(AdminAuditLog)
    private adminAuditLogRepository: Repository<AdminAuditLog>,
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

  private getDefaultContentAdminCredentials() {
    return {
      username: process.env.CONTENT_ADMIN_USERNAME || 'editor',
      password: process.env.CONTENT_ADMIN_PASSWORD || 'editor123456',
    };
  }

  private toProfile(adminUser: AdminUser) {
    return {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      role_label: getRoleLabel(adminUser.role),
      permissions: getAdminPermissions(adminUser.role),
      status: adminUser.status,
      account_type: adminUser.account_type || 'platform',
      merchant_id: adminUser.merchant_id ?? null,
      merchant_name: adminUser.merchant?.name || null,
      last_login_at: adminUser.last_login_at,
      created_at: adminUser.created_at,
    };
  }

  private signToken(adminUser: AdminUser) {
    return this.jwtService.sign({
      adminId: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      account_type: adminUser.account_type || 'platform',
      merchant_id: adminUser.merchant_id ?? null,
      merchant_name: adminUser.merchant?.name || null,
      type: 'admin',
    });
  }

  async ensureDefaultAdmin() {
    const defaultAdmin = this.getDefaultAdminCredentials();
    const contentAdmin = this.getDefaultContentAdminCredentials();

    await this.ensureSeedAdmin(defaultAdmin.username, defaultAdmin.password, 'super_admin');

    if (contentAdmin.username !== defaultAdmin.username) {
      await this.ensureSeedAdmin(contentAdmin.username, contentAdmin.password, 'content_admin');
    }
  }

  private async ensureSeedAdmin(
    username: string,
    password: string,
    role: AdminRole,
  ) {
    const existingAdmin = await this.adminUserRepository.findOne({
      where: { username },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!existingAdmin) {
      const adminUser = this.adminUserRepository.create({
        username,
        password: hashedPassword,
        role,
        status: 'active',
        account_type: 'platform',
        merchant_id: null,
      });
      await this.adminUserRepository.save(adminUser);
      return;
    }

    existingAdmin.password = hashedPassword;
    existingAdmin.role = role;
    existingAdmin.status = 'active';
    existingAdmin.account_type = existingAdmin.account_type || 'platform';
    await this.adminUserRepository.save(existingAdmin);
  }

  async login(username: string, password: string) {
    const adminUser = await this.adminUserRepository.findOne({
      where: { username },
      relations: ['merchant'],
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
    await this.adminAuditLogRepository.save(
      this.adminAuditLogRepository.create({
        admin_id: adminUser.id,
        admin_username: adminUser.username,
        admin_role: adminUser.role,
        action: 'login',
        resource_type: 'admin_auth',
        resource_id: String(adminUser.id),
        detail: '管理员登录成功',
      }),
    );

    return {
      admin: this.toProfile(adminUser),
      token: this.signToken(adminUser),
    };
  }

  async getProfile(adminId: number) {
    const adminUser = await this.adminUserRepository.findOne({
      where: { id: adminId },
      relations: ['merchant'],
    });

    if (!adminUser) {
      throw new UnauthorizedException('管理员账号不存在');
    }

    return {
      admin: this.toProfile(adminUser),
    };
  }
}

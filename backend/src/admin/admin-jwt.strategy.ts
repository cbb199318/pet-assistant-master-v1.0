import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    if (!payload?.adminId || payload?.type !== 'admin') {
      throw new UnauthorizedException();
    }

    return {
      adminId: payload.adminId,
      username: payload.username,
      role: payload.role || 'content_admin',
      account_type: payload.account_type || 'platform',
      merchant_id: payload.merchant_id ?? null,
      merchant_name: payload.merchant_name ?? null,
    };
  }
}

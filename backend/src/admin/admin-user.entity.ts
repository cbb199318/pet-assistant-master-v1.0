import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Merchant } from '../shop/merchant.entity';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 30, default: 'super_admin' })
  role: string;

  @Column({ type: 'varchar', length: 20, default: 'platform' })
  account_type: string;

  @ManyToOne(() => Merchant, merchant => merchant.adminUsers, { nullable: true })
  merchant: Merchant | null;

  @Column({ type: 'int', nullable: true })
  merchant_id: number | null;

  @Column({ type: 'datetime', nullable: true })
  last_login_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

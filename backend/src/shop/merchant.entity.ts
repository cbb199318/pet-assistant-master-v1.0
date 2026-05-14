import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AdminUser } from '../admin/admin-user.entity';
import { Product } from './product.entity';
import { ShopOrder } from './order.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 80, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contact_phone: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Product, product => product.merchant)
  products: Product[];

  @OneToMany(() => ShopOrder, order => order.merchant)
  orders: ShopOrder[];

  @OneToMany(() => AdminUser, adminUser => adminUser.merchant)
  adminUsers: AdminUser[];
}

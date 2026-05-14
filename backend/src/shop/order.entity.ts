import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from './merchant.entity';
import { User } from '../users/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('shop_orders')
export class ShopOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40, unique: true })
  order_no: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => Merchant, merchant => merchant.orders)
  merchant: Merchant;

  @Column({ type: 'int' })
  merchant_id: number;

  @Column({ type: 'varchar', length: 30, default: 'pending_confirmation' })
  status: string;

  @Column({ type: 'float', default: 0 })
  total_amount: number;

  @Column({ type: 'varchar', length: 40 })
  receiver_name: string;

  @Column({ type: 'varchar', length: 20 })
  receiver_phone: string;

  @Column({ type: 'varchar', length: 255 })
  receiver_address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark: string | null;

  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

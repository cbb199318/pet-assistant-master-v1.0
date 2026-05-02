import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serviceType: string; // 服务类型：hospital, grooming, etc.

  @Column()
  serviceName: string;

  @Column()
  serviceAddress: string;

  @Column()
  bookingDate: Date;

  @Column()
  bookingTime: string;

  @Column({ default: 'pending' })
  status: string; // 状态：pending, confirmed, completed, cancelled

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => User, user => user.bookings)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
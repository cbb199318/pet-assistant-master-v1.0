import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Pet } from '../pets/pet.entity';

@Entity('care_records')
export class Care {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  pet_id: number;

  @Column({ type: 'simple-enum', enum: ['feeding', 'walking', 'grooming', 'bathing', 'play', 'other'] })
  type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'simple-enum', enum: ['record', 'plan'], default: 'record' })
  mode: 'record' | 'plan';

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ type: 'time', nullable: true })
  time: string;

  @Column({ type: 'time', nullable: true })
  reminder_time: string;

  @Column({ type: 'simple-enum', enum: ['daily', 'weekdays', 'weekly', 'custom'], nullable: true })
  repeat_pattern: 'daily' | 'weekdays' | 'weekly' | 'custom';

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  quantity: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  is_completed: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_completed_at: Date;

  @Column({ type: 'int', nullable: true })
  source_plan_id: number;

  @ManyToOne(() => Pet, pet => pet.cares)
  pet: Pet;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}

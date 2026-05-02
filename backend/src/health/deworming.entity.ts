import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Pet } from '../pets/pet.entity';

@Entity('dewormings')
export class Deworming {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pet, pet => pet.dewormings)
  pet: Pet;

  @Column({ type: 'int', nullable: false })
  pet_id: number;

  @Column({ type: 'simple-enum', enum: ['internal', 'external', 'both'], nullable: false })
  type: 'internal' | 'external' | 'both';

  @Column({ type: 'varchar', length: 100, nullable: false })
  product_name: string;

  @Column({ type: 'date', nullable: false })
  deworming_date: Date;

  @Column({ type: 'date', nullable: true })
  next_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}

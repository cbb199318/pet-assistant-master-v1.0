import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Pet } from '../pets/pet.entity';

@Entity('checkups')
export class Checkup {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pet, pet => pet.checkups)
  pet: Pet;

  @Column({ type: 'int', nullable: false })
  pet_id: number;

  @Column({ type: 'date', nullable: false })
  checkup_date: Date;

  @Column({ type: 'varchar', length: 100, nullable: false })
  hospital: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  doctor: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @CreateDateColumn()
  created_at: Date;
}

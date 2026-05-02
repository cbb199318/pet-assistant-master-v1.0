import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Pet } from '../pets/pet.entity';

@Entity('vaccinations')
export class Vaccination {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pet, pet => pet.vaccinations)
  pet: Pet;

  @Column({ type: 'int', nullable: false })
  pet_id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  vaccine_name: string;

  @Column({ type: 'date', nullable: false })
  vaccination_date: Date;

  @Column({ type: 'date', nullable: true })
  next_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}

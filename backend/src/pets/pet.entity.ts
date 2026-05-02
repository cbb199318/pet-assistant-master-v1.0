import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Care } from '../care/care.entity';
import { Vaccination } from '../health/vaccination.entity';
import { Deworming } from '../health/deworming.entity';
import { Checkup } from '../health/checkup.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.pets)
  user: User;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  species: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  breed: string;

  @Column({ type: 'simple-enum', enum: ['male', 'female'], nullable: true })
  gender: 'male' | 'female';

  @Column({ type: 'date', nullable: true })
  birthday: Date;

  @Column({ type: 'boolean', default: false })
  sterilized: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Care, care => care.pet)
  cares: Care[];

  @OneToMany(() => Vaccination, vaccination => vaccination.pet)
  vaccinations: Vaccination[];

  @OneToMany(() => Deworming, deworming => deworming.pet)
  dewormings: Deworming[];

  @OneToMany(() => Checkup, checkup => checkup.pet)
  checkups: Checkup[];
}

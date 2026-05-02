import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { AiConversationMessage } from './ai.types';
import { Pet } from '../pets/pet.entity';

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @Column({ type: 'varchar', length: 120, nullable: false })
  title: string;

  @Column({ type: 'simple-json', nullable: false })
  messages: AiConversationMessage[];

  @Column({ type: 'int', nullable: true })
  pet_id?: number | null;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => Pet, { nullable: true })
  pet?: Pet | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

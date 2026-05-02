import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  admin_id: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  admin_username: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  admin_role: string;

  @Column({ type: 'varchar', length: 80, nullable: false })
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  resource_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resource_id: string | null;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}

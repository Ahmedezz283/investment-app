import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('jasper_render_payloads')
export class JasperRenderPayload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  rows: Array<Record<string, unknown>>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
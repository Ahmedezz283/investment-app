import {Column,Entity,PrimaryGeneratedColumn,} from 'typeorm';

@Entity('gorules')
export class Gorule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;
}
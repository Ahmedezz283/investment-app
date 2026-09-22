import { MaxLength, MinLength } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from '../department/departments.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  keycloakId: string;

  @Column()
  name: string;

  @Column({ default: 'Investor' })
  role: string;

  @Column({ unique: true })
  @MaxLength(14, { message: 'National ID must be at most 14 characters long' })
  @MinLength(14, { message: 'National ID must be at least 14 characters long' })
  National_ID: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.users, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ nullable: true })
  departmentId: string;

  @Column()
  IsAssigned: boolean;

}
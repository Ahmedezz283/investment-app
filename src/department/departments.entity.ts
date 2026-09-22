import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../user/user-entity.js';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  Description: string;

  @Column({ default: 0 })
  userCount: number;

  @OneToMany(() => User, (user) => user.department)
  users: User[];
}
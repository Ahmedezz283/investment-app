import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './departments.entity.js';
import { User } from '../user/user-entity.js';
import { CreateDepartmentDto } from './dto/create-department-dto.js';
import { UpdateDepartmentDto } from './dto/update-department-dto.js';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(dto: CreateDepartmentDto): Promise<Department> {
    const department = this.departmentRepository.create(dto);
    return this.departmentRepository.save(department);
  }

  findAll(): Promise<Department[]> {
    return this.departmentRepository.find();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);
    Object.assign(department, dto);
    return this.departmentRepository.save(department);
  }

  async remove(id: string): Promise<void> {
    const result = await this.departmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Department ${id} not found`);
    }
  }

  async assignUser(departmentId: string, userId: string): Promise<User> {
    await this.findOne(departmentId);

    const user =
      (await this.userRepository.findOne({ where: { id: userId } })) ??
      (await this.userRepository.findOne({ where: { keycloakId: userId } }));

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const previousDepartmentId = user.departmentId;

    if (previousDepartmentId === departmentId) {
      return user;
    }

    user.departmentId = departmentId;
    const saved = await this.userRepository.save(user);

    if (previousDepartmentId) {
      await this.departmentRepository.decrement(
        { id: previousDepartmentId },
        'userCount',
        1,
      );
    }

    await this.departmentRepository.increment({ id: departmentId }, 'userCount', 1);

    return saved;
  }
}
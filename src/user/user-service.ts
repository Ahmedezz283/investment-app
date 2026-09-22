import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeycloakAdminService } from '../keycloak/keycloak-admin-service.js';
import { User } from './user-entity.js';
import { CreateUserDto } from './dto/create-user-dto.js';
import { UpdateUserDto } from './dto/update-user-dto.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private keycloakAdminService: KeycloakAdminService,
  ) { }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByKeycloakId(keycloakId: string): Promise<User | null> {
    return this.userRepository.findOneBy({ keycloakId });
  }

  findByIdOrKeycloakId(id: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .orWhere('user.keycloakId = :keycloakId', { keycloakId: id })
      .orWhere('user.name = :name', { name: id })
      .getOne();
  }

  findByNationalId(nationalId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { National_ID: nationalId } });
  }

  create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async updateRole(id: string, role: string): Promise<User> {
    await this.userRepository.update(id, { role });
    return this.findOne(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findByIdOrKeycloakId(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.keycloakAdminService.deleteUser(user.keycloakId);
    await this.userRepository.remove(user);

    return { message: `User with id ${id} has been deleted successfully` };
  }
}
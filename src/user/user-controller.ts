import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { UserService } from './user-service.js';
import { User } from './user-entity.js';
import { CreateUserDto } from './dto/create-user-dto.js';
import { UpdateUserDto } from './dto/update-user-dto.js';
import { RegisterUserDto } from './dto/register-user-dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  // @Post()
  // create(@Body() createUserDto: CreateUserDto): Promise<User> {
  //   return this.userService.create(createUserDto);
  // }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.userService.remove(id);
  }

  // @Post('register')
  // register(@Body() registerUserDto: RegisterUserDto): Promise<User> {
  //   return this.userService.register(registerUserDto);
  // }
  
}
import { Controller, Post, Get, Body, Query, Res, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth-services.js';
import { LoginDto } from './dto/auth-login-dto.js';
import { UserService } from '../user/user-service.js';
import { RegisterDto } from './dto/auth-create-dto.js';
import { ForgetPasswordDto } from './dto/auth-forgetpass-dto.js';
import { AddRoleDto } from './dto/auth-add-roles.js';
import { AssignRoleDto } from './dto/auth-assginrole-dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { Roles } from './decorators/roles.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService , private userService: UserService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto){
    return this.authService.register(registerDto);
  }

  @Post('forget-password')
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }

  @Post('add-role')
  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  async addRole(@Body() dto: AddRoleDto) {
    return this.authService.addroles(dto.roleName, dto.description || '');
  }

  @Post('users/:userId/assign-role')
  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  async assignRoleToUser(@Param('userId') userId: string,@Body() dto: AssignRoleDto,) {
    return this.authService.assignRoleToUser(userId, dto.roleName);
  }

}
import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/auth-login-dto.js';
import { KeycloakAdminService } from '../keycloak/keycloak-admin-service.js';
import { RegisterDto } from './dto/auth-create-dto.js';
import { UserService } from '../user/user-service.js';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private keycloakAdminService: KeycloakAdminService,
    private userService: UserService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const authServerUrl = this.configService.get<string>('KEYCLOAK_AUTH_SERVER_URL');
      const realm = this.configService.get<string>('KEYCLOAK_REALM');
      const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');
      const clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET');

      if (!authServerUrl || !realm || !clientId || !clientSecret) {
        throw new InternalServerErrorException('Keycloak configuration is incomplete');
      }

      const response = await fetch(`${authServerUrl}/realms/${realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: clientId,
          client_secret: clientSecret,
          username: loginDto.username,
          password: loginDto.password,
        }),
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid username or password');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to authenticate with Keycloak');
    }
  }

 async register(registerDto: RegisterDto) {
  const existing = await this.userService.findByNationalId(registerDto.National_ID);
  if (existing) {
    throw new ConflictException('A user with this National ID already exists.');
  }

  let keycloakId: string | undefined;
  try {
    keycloakId = await this.keycloakAdminService.createUser(
      registerDto.username,
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
    );
  } catch (error: any) {
    if (error instanceof HttpException) {
      throw error;
    }
    if (error?.response?.status === 409) {
      throw new ConflictException('User with this username or email already exists');
    }
    throw new BadRequestException(
      error?.response?.data?.errorMessage || error.message || 'Failed to create user in Keycloak',
    );
  }

  try {
    const localUser = await this.userService.create({
      keycloakId,
      name: `${registerDto.firstName} ${registerDto.lastName}`,
      role: registerDto.role ?? 'Investor',
      National_ID: registerDto.National_ID,
      IsAssigned: registerDto.IsAssigned ?? false,
      departmentId: registerDto.departmentId,
    });
    return {
      message: 'Registration successful. verify your email to activate your account.',
      user: localUser,
    };
  } catch (error) {
    console.error('Local user save failed:', error);
    throw new InternalServerErrorException(
      'User was created in Keycloak, but failed to save in local database.',
    );
  }
}

  forgetPassword(email: string) {
    return this.keycloakAdminService.forgetPassword(email);
  }

  async addroles(rolename: string, description: string) {
    await this.keycloakAdminService.createRole(rolename, description);
    return { message: 'Role created successfully' };
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<{ message: string }> {
    let user = await this.userService.findByIdOrKeycloakId(userId);

    if (!user) {
      const kcUser = await this.keycloakAdminService.getUser(userId);
      if (kcUser && kcUser.id) {
        user = await this.userService.create({
          keycloakId: kcUser.id,
          name: `${kcUser.firstName || ''} ${kcUser.lastName || ''}`.trim() || kcUser.username || 'User',
          role: roleName,
          National_ID: '00000000000000',
          IsAssigned: false,
          departmentId: undefined,
        });
      }
    }

    if (!user) {
      throw new BadRequestException('User not found in local database or Keycloak');
    }

    await this.keycloakAdminService.assignRoleToUser(user.keycloakId, roleName);
    await this.userService.updateRole(user.id, roleName);

    return { message: `Role '${roleName}' assigned to user ${user.keycloakId}` };
  }

}
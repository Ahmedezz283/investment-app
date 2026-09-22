import { Module } from '@nestjs/common';
import { AuthService } from './auth-services.js';
import { AuthController } from './auth-controller.js';
import { KeycloakModule } from '../keycloak/keycloak-module.js';
import { UserModule } from '../user/user-module.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
  imports: [KeycloakModule, UserModule],
})
export class AuthModule {}
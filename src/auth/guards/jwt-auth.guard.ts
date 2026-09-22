import { CanActivate,ExecutionContext,Injectable,UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { UserService } from '../../user/user-service.js';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwksClient: jwksRsa.JwksClient;

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    const authServerUrl = this.configService.get<string>('KEYCLOAK_AUTH_SERVER_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');

    this.jwksClient = jwksRsa({
      jwksUri: `${authServerUrl}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header.kid) {
        throw new UnauthorizedException('Invalid JWT token header');
      }

      const key = await this.jwksClient.getSigningKey(decodedHeader.header.kid);
      const publicKey = key.getPublicKey();

      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as any;

      const keycloakId = payload.sub;
      if (!keycloakId) {
        throw new UnauthorizedException('Token contains no subject (sub)');
      }

      let localUser = await this.userService.findByKeycloakId(keycloakId);
      if (!localUser) {
        const fullName =
          payload.name ||
          `${payload.given_name || ''} ${payload.family_name || ''}`.trim() ||
          payload.preferred_username ||
          'User';
        const role =
          payload.realm_access?.roles?.find(
            (r: string) => !['default-roles-investment', 'offline_access', 'uma_authorization'].includes(r),
          ) || 'Investor';

        localUser = await this.userService.create({
          keycloakId,
          name: fullName,
          role,
          National_ID: '00000000000000',
          IsAssigned: false,
          departmentId: undefined,
        });
      }

      const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');
      const realmRoles: string[] = payload.realm_access?.roles || [];
      const clientRoles: string[] =
        clientId && payload.resource_access?.[clientId]?.roles
          ? payload.resource_access[clientId].roles
          : [];
      const allRoles = Array.from(new Set([...realmRoles, ...clientRoles]));

      const authenticatedUser: AuthenticatedUser = {
        ...localUser,
        roles: allRoles,
        keycloakPayload: payload,
      };

      request.user = authenticatedUser;
      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(error.message || 'Unauthorized');
    }
  }
}

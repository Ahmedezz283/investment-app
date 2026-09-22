import { User } from '../../user/user-entity.js';

export interface AuthenticatedUser extends User {
  roles: string[];
  keycloakPayload: Record<string, any>;
}

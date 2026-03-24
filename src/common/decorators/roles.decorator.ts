import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/shared/constants';

export { ROLES_KEY };
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

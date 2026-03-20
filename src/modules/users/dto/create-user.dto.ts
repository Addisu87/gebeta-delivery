import { UserRole } from 'src/shared/enums/role.enum';

export class CreateUserDto {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  roles: UserRole[] = [];
  isEmailVerified: boolean;
}

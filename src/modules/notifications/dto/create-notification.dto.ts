import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationType } from 'src/shared/enums/notification-type.enum';

export class CreateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

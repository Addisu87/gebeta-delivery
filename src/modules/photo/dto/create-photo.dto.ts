import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePhotoDto {
  @IsString()
  ownerType: string;

  @IsUUID()
  ownerId: string;

  @IsString()
  path: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

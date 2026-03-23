import { IsString, IsBoolean } from 'class-validator';

export class OperatingHoursDto {
  @IsString()
  day: string; // Monday, Tuesday...

  @IsString()
  openTime: string; // "08:00"

  @IsString()
  closeTime: string; // "22:00"

  @IsBoolean()
  isClosed: boolean;
}

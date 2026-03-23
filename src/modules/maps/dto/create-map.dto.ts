import { IsNumber, IsString } from 'class-validator';

export class CreateMapDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

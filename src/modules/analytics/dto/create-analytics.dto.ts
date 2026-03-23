import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAnalyticsDto {
  @IsString()
  metricName: string;

  @IsNumber()
  metricValue: number;

  @IsOptional()
  @IsString()
  period?: string;
}

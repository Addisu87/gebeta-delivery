import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  resultCount?: number;
}

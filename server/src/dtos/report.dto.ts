import { IsNumber, IsNotEmpty } from 'class-validator';

export class GetReportDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;
} 
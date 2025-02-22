import { IsInt, Min, Max } from 'class-validator';

export class CreateDoubleEdgedAnswerDto {
  @IsInt()
  userId: number;

  @IsInt()
  doubleEdgedId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;
}

export class UpdateDoubleEdgedAnswerDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score: number;
}

export class DoubleEdgedAnswerResponseDto {
  id: number;
  userId: number;
  doubleEdgedId: number;
  score: number;
  submittedAt: Date;
}
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WithdrawalStatus } from '@prisma/client';

export class UpdateWithdrawalDto {
  @IsEnum(WithdrawalStatus)
  status!: WithdrawalStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

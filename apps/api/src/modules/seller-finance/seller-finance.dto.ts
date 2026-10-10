import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsInt()
  @Min(10000)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  accountName!: string;
}

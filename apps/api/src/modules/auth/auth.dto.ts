import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class AddressDto {
  @ApiProperty()
  @IsString()
  recipientName!: string;

  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsString()
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty()
  @IsString()
  district!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(AddressDto) {}

export class UserResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty()
  name!: string;
  @ApiPropertyOptional()
  phone!: string | null;
  @ApiPropertyOptional()
  avatarUrl!: string | null;
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken!: string;
  @ApiProperty()
  refreshToken!: string;
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

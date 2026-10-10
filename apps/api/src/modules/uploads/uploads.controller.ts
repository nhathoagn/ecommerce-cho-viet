import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards.js';
import { PresignUploadDto } from '../seller-catalog/catalog.dto.js';
import { UploadsService } from './uploads.service.js';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}
  @Post('presign') presign(
    @CurrentUser() user: AuthUser,
    @Body() dto: PresignUploadDto,
  ) {
    return this.uploads.presign(user.id, dto);
  }
}

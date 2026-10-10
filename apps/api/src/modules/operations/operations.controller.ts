import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { OperationsGuard } from './operations.guard.js';
import { UpdateWithdrawalDto } from './operations.dto.js';
import { OperationsService } from './operations.service.js';

@ApiTags('operations')
@ApiHeader({ name: 'x-ops-api-key', required: true })
@UseGuards(OperationsGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}
  @Get('overview') overview() { return this.operations.overview(); }
  @Get('withdrawals') withdrawals() { return this.operations.withdrawals(); }
  @Patch('withdrawals/:id') update(@Param('id') id: string, @Body() dto: UpdateWithdrawalDto) { return this.operations.updateWithdrawal(id, dto); }
}

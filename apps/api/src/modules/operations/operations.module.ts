import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller.js';
import { OperationsGuard } from './operations.guard.js';
import { OperationsService } from './operations.service.js';

@Module({ controllers: [OperationsController], providers: [OperationsService, OperationsGuard] })
export class OperationsModule {}

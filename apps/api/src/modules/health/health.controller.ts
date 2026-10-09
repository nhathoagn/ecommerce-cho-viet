import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái API' })
  check() {
    return {
      status: 'ok',
      service: 'ecommerce-api',
      timestamp: new Date().toISOString(),
    }
  }
}

import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      status: 'ok',
      service: 'HRIS One API Gateway',
      availableEndpoints: ['/users', '/roles', '/attendance'],
    };
  }
}

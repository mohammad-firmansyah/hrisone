import { Module } from '@nestjs/common';
import { RoleService } from './role.service.js';
import { RoleController } from './role.controller.js';

@Module({
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern('createRole')
  create(@Payload() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @MessagePattern('findAllRole')
  findAll() {
    return this.roleService.findAll();
  }

  @MessagePattern('findOneRole')
  findOne(@Payload() id: number) {
    return this.roleService.findOne(id);
  }

  @MessagePattern('updateRole')
  update(@Payload() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(updateRoleDto.id, updateRoleDto);
  }

  @MessagePattern('removeRole')
  remove(@Payload() id: number) {
    return this.roleService.remove(id);
  }
}

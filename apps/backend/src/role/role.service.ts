import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { rpcError } from '../common/rpc.js';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const trimmedName = String(createRoleDto.name || '').trim().toUpperCase();
    if (!trimmedName) {
      throw rpcError(HttpStatus.BAD_REQUEST, 'Role name is required');
    }

    const existing = await this.roles.findOne({ where: { name: trimmedName } });
    if (existing) {
      throw rpcError(HttpStatus.CONFLICT, `Role ${trimmedName} already exists`);
    }

    const role = this.roles.create({
      name: trimmedName,
      created_by: createRoleDto.created_by ?? 1,
      updated_by: createRoleDto.created_by ?? 1,
    });
    return this.roles.save(role);
  }

  async findAll() {
    return this.roles.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) {
      throw rpcError(HttpStatus.NOT_FOUND, `Role #${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (updateRoleDto.name !== undefined) {
      const trimmedName = String(updateRoleDto.name).trim().toUpperCase();
      if (!trimmedName) {
        throw rpcError(HttpStatus.BAD_REQUEST, 'Role name cannot be empty');
      }
      role.name = trimmedName;
    }
    if (updateRoleDto.updated_by !== undefined) {
      role.updated_by = updateRoleDto.updated_by;
    }
    return this.roles.save(role);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    try {
      await this.roles.remove(role);
      return { success: true, id };
    } catch {
      throw rpcError(
        HttpStatus.CONFLICT,
        `Cannot delete role #${id} because it is referenced by existing users.`,
      );
    }
  }
}


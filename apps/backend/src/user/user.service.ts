import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { Role } from '../role/entities/role.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { hashPassword, validatePasswordStrength } from '../auth/password.js';
import { rpcError } from '../common/rpc.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const name = String(createUserDto.name || '').trim();
    if (!name) {
      throw rpcError(HttpStatus.BAD_REQUEST, 'Name is required');
    }

    const email = String(createUserDto.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw rpcError(HttpStatus.BAD_REQUEST, 'A valid email address is required');
    }

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw rpcError(HttpStatus.CONFLICT, `User with email ${email} already exists`);
    }

    const roleId = Number(createUserDto.role_id);
    if (!roleId) {
      throw rpcError(HttpStatus.BAD_REQUEST, 'Role ID is required');
    }

    const role = await this.roles.findOne({ where: { id: roleId } });
    if (!role) {
      throw rpcError(HttpStatus.NOT_FOUND, `Role #${roleId} not found`);
    }

    const rawPassword = String(createUserDto.password || '');
    const passwordError = validatePasswordStrength(rawPassword);
    if (passwordError) {
      throw rpcError(HttpStatus.BAD_REQUEST, passwordError);
    }

    const hashedPassword = await hashPassword(rawPassword);

    const user = this.users.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: createUserDto.status ?? true,
      session_version: 0,
      created_by: createUserDto.created_by ?? 1,
      updated_by: createUserDto.created_by ?? 1,
    });

    const saved = await this.users.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async findAll() {
    return this.users.find({
      relations: { role: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const user = await this.users.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw rpcError(HttpStatus.NOT_FOUND, `User #${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.users.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw rpcError(HttpStatus.NOT_FOUND, `User #${id} not found`);
    }

    if (updateUserDto.name !== undefined) {
      const name = String(updateUserDto.name).trim();
      if (!name) {
        throw rpcError(HttpStatus.BAD_REQUEST, 'Name cannot be empty');
      }
      user.name = name;
    }

    if (updateUserDto.email !== undefined) {
      const newEmail = String(updateUserDto.email).trim().toLowerCase();
      if (!newEmail || !newEmail.includes('@')) {
        throw rpcError(HttpStatus.BAD_REQUEST, 'A valid email address is required');
      }
      if (newEmail !== user.email) {
        const conflict = await this.users.findOne({ where: { email: newEmail } });
        if (conflict && conflict.id !== id) {
          throw rpcError(HttpStatus.CONFLICT, `Email ${newEmail} is already in use`);
        }
        user.email = newEmail;
      }
    }

    if (updateUserDto.role_id !== undefined) {
      const roleId = Number(updateUserDto.role_id);
      const role = await this.roles.findOne({ where: { id: roleId } });
      if (!role) {
        throw rpcError(HttpStatus.NOT_FOUND, `Role #${roleId} not found`);
      }
      user.role = role;
    }

    if (updateUserDto.password) {
      const passwordError = validatePasswordStrength(updateUserDto.password);
      if (passwordError) {
        throw rpcError(HttpStatus.BAD_REQUEST, passwordError);
      }
      user.password = await hashPassword(updateUserDto.password);
      user.session_version += 1; // Invalidate all active sessions for this user
    }

    if (updateUserDto.status !== undefined) {
      const newStatus = Boolean(updateUserDto.status);
      if (user.status && !newStatus) {
        user.session_version += 1; // Invalidate sessions on deactivation
      }
      user.status = newStatus;
    }

    if (updateUserDto.updated_by !== undefined) {
      user.updated_by = updateUserDto.updated_by;
    }

    const saved = await this.users.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    try {
      await this.users.delete(id);
      return { success: true, message: `User #${id} deleted` };
    } catch {
      // If foreign keys prevent hard deletion (e.g. attendance records exist), soft delete
      user.status = false;
      user.session_version += 1;
      await this.users.save(user);
      return { success: true, message: `User #${id} deactivated (has related records)` };
    }
  }
}


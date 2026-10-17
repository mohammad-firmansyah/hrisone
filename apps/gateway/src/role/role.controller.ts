import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard, Roles } from '../auth/auth.guard.js';

function handleRpcError(err: any): never {
  const status = err?.status || err?.error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err?.message || err?.error?.message || 'Internal server error';
  throw new HttpException(message, status);
}

@Controller('roles')
@UseGuards(AuthGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class RoleController {
  constructor(
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Post()
  async create(@Body() createRoleDto: any) {
    try {
      return await firstValueFrom(this.backendClient.send('createRole', createRoleDto));
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Get()
  async findAll() {
    try {
      return await firstValueFrom(this.backendClient.send('findAllRole', {}));
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await firstValueFrom(this.backendClient.send('findOneRole', +id));
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: any) {
    try {
      return await firstValueFrom(
        this.backendClient.send('updateRole', { id: +id, ...updateRoleDto }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await firstValueFrom(this.backendClient.send('removeRole', +id));
    } catch (e) {
      handleRpcError(e);
    }
  }
}


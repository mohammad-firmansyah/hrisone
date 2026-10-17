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
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard, Roles } from '../auth/auth.guard.js';

function handleRpcError(err: any): never {
  const status = err?.status || err?.error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err?.message || err?.error?.message || 'Internal server error';
  throw new HttpException(message, status);
}

@Controller('users')
@UseGuards(AuthGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class UserController {
  constructor(
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Post()
  async create(@Req() req: any, @Body() createUserDto: any) {
    try {
      return await firstValueFrom(
        this.backendClient.send('createUser', {
          ...createUserDto,
          created_by: req.user?.id || 1,
        }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Get()
  async findAll() {
    try {
      return await firstValueFrom(this.backendClient.send('findAllUser', {}));
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await firstValueFrom(this.backendClient.send('findOneUser', +id));
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateUserDto: any) {
    const targetId = +id;
    // Prevent self-deactivation
    if (req.user?.id === targetId && updateUserDto.status === false) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    try {
      return await firstValueFrom(
        this.backendClient.send('updateUser', {
          id: targetId,
          ...updateUserDto,
          updated_by: req.user?.id || 1,
        }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const targetId = +id;
    // Prevent self-deletion
    if (req.user?.id === targetId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    try {
      return await firstValueFrom(this.backendClient.send('removeUser', targetId));
    } catch (e) {
      handleRpcError(e);
    }
  }
}


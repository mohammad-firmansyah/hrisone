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
import { AuthGuard } from '../auth/auth.guard.js';

function handleRpcError(err: any): never {
  const status = err?.status || err?.error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err?.message || err?.error?.message || 'Internal server error';
  throw new HttpException(message, status);
}

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Post()
  async create(@Body() createUserDto: any) {
    try {
      return await firstValueFrom(this.backendClient.send('createUser', createUserDto));
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
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    try {
      return await firstValueFrom(
        this.backendClient.send('updateUser', { id: +id, ...updateUserDto }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await firstValueFrom(this.backendClient.send('removeUser', +id));
    } catch (e) {
      handleRpcError(e);
    }
  }
}


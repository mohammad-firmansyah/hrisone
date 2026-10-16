import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  Inject,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    sessionVersion: number;
  };
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

interface MulterFile {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

function validateImageFile(file?: MulterFile): { base64: string; ext: 'jpg' | 'png' | 'webp' } {
  if (!file || !file.buffer) {
    throw new BadRequestException('Attendance photo is required.');
  }
  if (file.buffer.length > MAX_PHOTO_BYTES) {
    throw new BadRequestException('Photo must be less than 5 MB.');
  }

  const buf = file.buffer;
  let ext: 'jpg' | 'png' | 'webp' | null = null;

  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    ext = 'jpg';
  } else if (
    buf.length > 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    ext = 'png';
  } else if (
    buf.length > 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    ext = 'webp';
  }

  if (!ext) {
    throw new BadRequestException('Invalid photo format. Only JPG, PNG, and WebP are allowed.');
  }

  return {
    base64: buf.toString('base64'),
    ext,
  };
}

function handleRpcError(err: any): never {
  const status = err?.status || err?.error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err?.message || err?.error?.message || 'Internal server error';
  throw new HttpException(message, status);
}

@Controller('attendance')
@UseGuards(AuthGuard)
export class AttendanceController {
  constructor(
    @Inject('BACKEND_SERVICE') private readonly backendClient: ClientProxy,
  ) {}

  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    try {
      return await firstValueFrom(
        this.backendClient.send('attendance.status', { userId: req.user.id }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Post('clock-in')
  @UseInterceptors(FileInterceptor('image'))
  async clockIn(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: MulterFile,
    @Body() body: { notes?: string; latitude?: string; longitude?: string },
  ) {
    const photo = validateImageFile(file);
    const notes = String(body.notes || '').trim();
    if (!notes || notes.length < 1 || notes.length > 500) {
      throw new BadRequestException('WFH note is required (1–500 characters).');
    }

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('Valid location coordinates (latitude & longitude) are required.');
    }

    try {
      return await firstValueFrom(
        this.backendClient.send('attendance.clockIn', {
          userId: req.user.id,
          latitude,
          longitude,
          notes,
          photo,
        }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Post('clock-out')
  @UseInterceptors(FileInterceptor('image'))
  async clockOut(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: MulterFile,
    @Body() body: { latitude?: string; longitude?: string },
  ) {
    const photo = validateImageFile(file);
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('Valid location coordinates (latitude & longitude) are required.');
    }

    try {
      return await firstValueFrom(
        this.backendClient.send('attendance.clockOut', {
          userId: req.user.id,
          latitude,
          longitude,
          photo,
        }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  @Get('mine')
  async getMine(@Req() req: AuthenticatedRequest) {
    try {
      return await firstValueFrom(
        this.backendClient.send('attendance.mine', { userId: req.user.id }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  /**
   * Admin-only endpoint: view all user attendance logs.
   * NOTE: Per security requirements, attendance is append-only and strictly read-only for admins.
   */
  @Get('all')
  async getAll(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const role = (req.user.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only administrators can access attendance logs.');
    }

    try {
      return await firstValueFrom(
        this.backendClient.send('attendance.all', {
          requesterId: req.user.id,
          page: Number(page) || 1,
          pageSize: Number(pageSize) || 20,
        }),
      );
    } catch (e) {
      handleRpcError(e);
    }
  }

  /**
   * Retrieve uploaded attendance photo (in or out).
   * Accessible by record owner or administrators.
   */
  @Get(':id/photo/:kind')
  async getPhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('kind') kind: 'in' | 'out',
    @Res() res: Response,
  ) {
    if (kind !== 'in' && kind !== 'out') {
      throw new NotFoundException('Photo not found.');
    }

    try {
      const result = await firstValueFrom(
        this.backendClient.send('attendance.photo', {
          requesterId: req.user.id,
          id: Number(id),
          kind,
        }),
      );

      const buf = Buffer.from(result.base64, 'base64');
      res.setHeader('Content-Type', result.mime);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      res.send(buf);
    } catch (e) {
      handleRpcError(e);
    }
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity.js';
import { User } from '../user/entities/user.entity.js';
import { isAdminRole, rpcError } from '../common/rpc.js';
import { PhotoStorage } from './photo-storage.js';
import { ClockInPayload, ClockOutPayload, ListAllPayload, PhotoRequestPayload } from './dto/create-attendance.dto.js';

const TIMEZONE = process.env.APP_TIMEZONE ?? 'Asia/Jakarta';
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(d);

export type AttendanceState = 'none' | 'clocked_in' | 'done';

function assertCoords(lat: unknown, lng: unknown): { lat: number; lng: number } {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || la < -90 || la > 90 || !Number.isFinite(lo) || lo < -180 || lo > 180) {
    throw rpcError(HttpStatus.BAD_REQUEST, 'Invalid location.');
  }
  return { lat: la, lng: lo };
}

function toView(a: Attendance, withUser = false) {
  return {
    id: a.id,
    type: a.type,
    notes: a.notes,
    clockIn: a.clock_in,
    clockInLocation: { latitude: a.clock_in_latitude, longitude: a.clock_in_longitude },
    clockOut: a.clock_out,
    clockOutLocation:
      a.clock_out_latitude == null ? null : { latitude: a.clock_out_latitude, longitude: a.clock_out_longitude },
    ...(withUser && a.user ? { user: { id: a.user.id, name: a.user.name, email: a.user.email } } : {}),
  };
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private readonly repo: Repository<Attendance>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly photos: PhotoStorage,
  ) {}

  /** Looks up role from the DB rather than trusting what the caller says. */
  private async roleOf(userId: number): Promise<string> {
    const u = await this.users.findOne({ where: { id: userId, status: true }, relations: { role: true } });
    if (!u) throw rpcError(HttpStatus.UNAUTHORIZED, 'Not authenticated.');
    return u.role.name;
  }

  private async assertEmployee(userId: number) {
    if (isAdminRole(await this.roleOf(userId))) {
      throw rpcError(HttpStatus.FORBIDDEN, 'Admins do not record attendance.');
    }
  }

  private latest(userId: number) {
    return this.repo.findOne({ where: { user: { id: userId } }, order: { clock_in: 'DESC' } });
  }

  async status(userId: number) {
    const last = await this.latest(userId);
    let state: AttendanceState = 'none';
    if (last && !last.clock_out) state = 'clocked_in';
    else if (last && dayKey(last.clock_in) === dayKey(new Date())) state = 'done';
    return { state, current: last && state !== 'none' ? toView(last) : null };
  }

  async clockIn(p: ClockInPayload) {
    await this.assertEmployee(p.userId);
    const { lat, lng } = assertCoords(p.latitude, p.longitude);
    const notes = String(p.notes ?? '').trim();
    if (notes.length < 1 || notes.length > 500) throw rpcError(HttpStatus.BAD_REQUEST, 'Note must be 1–500 characters.');

    const { state } = await this.status(p.userId);
    if (state === 'clocked_in') throw rpcError(HttpStatus.CONFLICT, 'You are already clocked in.');
    if (state === 'done') throw rpcError(HttpStatus.CONFLICT, 'Attendance for today is already complete.');

    const image = await this.photos.save(p.photo?.base64, p.photo?.ext);
    try {
      const saved = await this.repo.save(
        this.repo.create({
          user: { id: p.userId },
          type: 'WFH',
          notes,
          clock_in: new Date(), // server time; never trust client clocks
          clock_in_latitude: lat,
          clock_in_longitude: lng,
          clock_in_image: image,
          created_by: p.userId,
          updated_by: p.userId,
        }),
      );
      return toView(saved);
    } catch (e) {
      await this.photos.remove(image);
      throw e;
    }
  }

  async clockOut(p: ClockOutPayload) {
    await this.assertEmployee(p.userId);
    const { lat, lng } = assertCoords(p.latitude, p.longitude);

    const open = await this.repo.findOne({ where: { user: { id: p.userId }, clock_out: IsNull() } });
    if (!open) throw rpcError(HttpStatus.CONFLICT, 'You are not clocked in.');

    const image = await this.photos.save(p.photo?.base64, p.photo?.ext);
    try {
      // Conditional update so a concurrent double-submit can't overwrite a clock-out.
      const res = await this.repo.update(
        { id: open.id, clock_out: IsNull() },
        {
          clock_out: new Date(),
          clock_out_latitude: lat,
          clock_out_longitude: lng,
          clock_out_image: image,
          updated_by: p.userId,
        },
      );
      if (!res.affected) throw rpcError(HttpStatus.CONFLICT, 'You are not clocked in.');
    } catch (e) {
      await this.photos.remove(image);
      throw e;
    }
    return toView((await this.repo.findOneByOrFail({ id: open.id })));
  }

  async mine(userId: number) {
    const rows = await this.repo.find({ where: { user: { id: userId } }, order: { clock_in: 'DESC' }, take: 100 });
    return rows.map((r) => toView(r));
  }

  /** Admin-only, read-only listing of everyone's attendance. */
  async all(p: ListAllPayload) {
    if (!isAdminRole(await this.roleOf(p.requesterId))) throw rpcError(HttpStatus.FORBIDDEN, 'Forbidden.');
    const pageSize = Math.min(Math.max(Math.trunc(Number(p.pageSize) || 20), 1), 100);
    const page = Math.max(Math.trunc(Number(p.page) || 1), 1);
    const [rows, total] = await this.repo.findAndCount({
      relations: { user: true },
      order: { clock_in: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((r) => toView(r, true)), total, page, pageSize };
  }

  /** Owner or admin only. Returns 404 (not 403) to avoid revealing which IDs exist. */
  async photo(p: PhotoRequestPayload) {
    if (p.kind !== 'in' && p.kind !== 'out') throw rpcError(HttpStatus.NOT_FOUND, 'Photo not found.');
    const row = await this.repo
      .createQueryBuilder('a')
      .addSelect(['a.clock_in_image', 'a.clock_out_image'])
      .innerJoinAndSelect('a.user', 'u')
      .where('a.id = :id', { id: Number(p.id) })
      .getOne();
    const isAdmin = isAdminRole(await this.roleOf(p.requesterId));
    if (!row || (!isAdmin && row.user.id !== p.requesterId)) throw rpcError(HttpStatus.NOT_FOUND, 'Photo not found.');

    const name = p.kind === 'in' ? row.clock_in_image : row.clock_out_image;
    if (!name) throw rpcError(HttpStatus.NOT_FOUND, 'Photo not found.');
    const { mime, data } = await this.photos.read(name);
    return { mime, base64: data.toString('base64') };
  }
}

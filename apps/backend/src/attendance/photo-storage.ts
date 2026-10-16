import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rpcError } from '../common/rpc.js';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// Allow-list: extension -> MIME + magic-byte check. The gateway already
// validated content with `file-type`; this is defence in depth because the
// backend must not trust anything arriving over the wire.
const TYPES = {
  jpg: { mime: 'image/jpeg', match: (b: Buffer) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png: {
    mime: 'image/png',
    match: (b: Buffer) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  webp: {
    mime: 'image/webp',
    match: (b: Buffer) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
} as const;
export type PhotoExt = keyof typeof TYPES;

// Only names this service generated are ever read back.
const NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

@Injectable()
export class PhotoStorage {
  private readonly logger = new Logger(PhotoStorage.name);
  // Stored outside src/ and any static web root; files are only served through
  // the authenticated gateway endpoint.
  private readonly dir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads', 'attendance'));

  async save(base64: string, ext: string): Promise<string> {
    if (!Object.hasOwn(TYPES, ext)) throw rpcError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'Unsupported image type.');
    const buf = Buffer.from(base64, 'base64');
    if (buf.length === 0 || buf.length > MAX_PHOTO_BYTES) throw rpcError(HttpStatus.PAYLOAD_TOO_LARGE, 'Photo must be at most 5 MB.');
    if (!TYPES[ext as PhotoExt].match(buf)) throw rpcError(HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'File content is not a valid image.');

    // TODO(security): scan uploads with an antivirus service before persisting.
    await mkdir(this.dir, { recursive: true, mode: 0o700 });
    const name = `${randomUUID()}.${ext}`;
    // 0o600: owner read/write only, never executable. 'wx' fails if the name somehow exists.
    await writeFile(this.resolve(name), buf, { mode: 0o600, flag: 'wx' });
    return name;
  }

  async read(name: string): Promise<{ mime: string; data: Buffer }> {
    const data = await readFile(this.resolve(name));
    const ext = name.split('.').pop() as PhotoExt;
    return { mime: TYPES[ext].mime, data };
  }

  async remove(name: string): Promise<void> {
    try {
      await unlink(this.resolve(name));
    } catch {
      this.logger.warn('Failed to clean up orphaned photo');
    }
  }

  private resolve(name: string): string {
    if (!NAME_RE.test(name)) throw rpcError(HttpStatus.NOT_FOUND, 'Photo not found.');
    const full = path.resolve(this.dir, name);
    if (!full.startsWith(this.dir + path.sep)) throw rpcError(HttpStatus.NOT_FOUND, 'Photo not found.');
    return full;
  }
}

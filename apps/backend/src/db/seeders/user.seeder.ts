import type { DataSource } from 'typeorm';
import { hashPassword } from '../../auth/password.js';

export interface SeedUser {
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  password?: string;
  status?: boolean;
}

export const DEFAULT_USERS: SeedUser[] = [
  {
    name: 'System Administrator',
    email: 'admin@hris.com',
    role: 'ADMIN',
  },
  {
    name: 'HR Manager',
    email: 'hr.admin@hris.com',
    role: 'ADMIN',
  },
  {
    name: 'John Employee',
    email: 'user@hris.com',
    role: 'USER',
  },
  {
    name: 'Alice Smith',
    email: 'alice.smith@hris.com',
    role: 'USER',
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@hris.com',
    role: 'USER',
  },
  {
    name: 'Carol Williams',
    email: 'carol.williams@hris.com',
    role: 'USER',
  },
  {
    name: 'David Lee',
    email: 'david.lee@hris.com',
    role: 'USER',
  },
  {
    name: 'Emma Watson',
    email: 'emma.watson@hris.com',
    role: 'USER',
  },
];

export interface SeedOptions {
  extraCount?: number;
  defaultPassword?: string;
  users?: SeedUser[];
}

/**
 * Ensures required roles exist in the database and returns a name -> id map.
 */
async function ensureRoles(dataSource: DataSource): Promise<Map<string, number>> {
  const roleMap = new Map<string, number>();
  const requiredRoles = ['ADMIN', 'USER', 'SUPERADMIN'];

  for (const roleName of requiredRoles) {
    const existing = await dataSource.query(
      'SELECT id FROM role WHERE UPPER(name) = ? LIMIT 1',
      [roleName],
    );

    if (existing && existing.length > 0) {
      roleMap.set(roleName, Number(existing[0].id));
    } else {
      const result = await dataSource.query(
        'INSERT INTO role (name, created_by, updated_by, created_at, updated_at) VALUES (?, 1, 1, NOW(), NOW())',
        [roleName],
      );
      const insertedId = Number(result.insertId);
      roleMap.set(roleName, insertedId);
      console.log(`[Role] Created missing role: ${roleName} (ID: ${insertedId})`);
    }
  }

  return roleMap;
}

/**
 * Seeds initial users and optional batch employees into the database.
 * Idempotent: checks email uniqueness before inserting to prevent duplicate records.
 */
export async function seedUsers(dataSource: DataSource, options: SeedOptions = {}) {
  const defaultPassword = options.defaultPassword || process.env.SEED_USER_PASSWORD || '@Mohammad842';
  const roleMap = await ensureRoles(dataSource);

  const defaultHash = await hashPassword(defaultPassword);
  const usersToSeed: SeedUser[] = [...(options.users || DEFAULT_USERS)];

  // If extra employee count is requested, generate them dynamically
  if (options.extraCount && options.extraCount > 0) {
    for (let i = 1; i <= options.extraCount; i++) {
      usersToSeed.push({
        name: `Employee ${i}`,
        email: `employee${i}@hris.com`,
        role: 'USER',
      });
    }
  }

  let createdCount = 0;
  let skippedCount = 0;

  console.log(`\nStarting user seeding (${usersToSeed.length} candidate user(s))...`);

  for (const u of usersToSeed) {
    const roleId = roleMap.get(u.role.toUpperCase());
    if (!roleId) {
      console.warn(`[User] Skipped ${u.email}: Unknown role '${u.role}'`);
      continue;
    }

    const existing = await dataSource.query(
      'SELECT id FROM user WHERE email = ? LIMIT 1',
      [u.email.trim().toLowerCase()],
    );

    if (existing && existing.length > 0) {
      skippedCount++;
      continue;
    }

    const passwordHash = u.password ? await hashPassword(u.password) : defaultHash;
    const status = u.status !== undefined ? (u.status ? 1 : 0) : 1;

    await dataSource.query(
      `INSERT INTO user (
        name,
        email,
        password,
        role_id,
        status,
        session_version,
        created_by,
        updated_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 1, 1, NOW(), NOW())`,
      [
        u.name.trim(),
        u.email.trim().toLowerCase(),
        passwordHash,
        roleId,
        status,
      ],
    );

    createdCount++;
    console.log(`[User] + Created: ${u.email.padEnd(25)} | Role: ${u.role.padEnd(6)} | Name: ${u.name}`);
  }

  console.log(`\nUser seeding finished.`);
  console.log(`  - Newly created: ${createdCount}`);
  console.log(`  - Already exist: ${skippedCount}`);
  console.log(`  - Default password for seeded accounts: ${defaultPassword}\n`);

  return { createdCount, skippedCount };
}

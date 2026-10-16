import '../env.js';
import { MysqlDatasource } from './datasource/MysqlDatasource.js';
import { hashPassword } from '../auth/password.js';

async function seed() {
  await MysqlDatasource.initialize();
  console.log('Seeding initial users...');

  const passwordHash = await hashPassword('@Mohammad842');

  // Check or create admin
  const existingAdmin = await MysqlDatasource.query(
    'SELECT id FROM user WHERE email = ?',
    ['admin@hris.com']
  );
  if (existingAdmin.length === 0) {
    await MysqlDatasource.query(
      `INSERT INTO user (name, email, password, role_id, status, session_version, created_by, updated_by)
       VALUES (?, ?, ?, 1, 1, 0, 1, 1)`,
      ['Administrator', 'admin@hris.com', passwordHash]
    );
    console.log('Created default admin: admin@hris.com / @Mohammad842');
  } else {
    console.log('Admin already exists.');
  }

  // Check or create regular user
  const existingUser = await MysqlDatasource.query(
    'SELECT id FROM user WHERE email = ?',
    ['user@hris.com']
  );
  if (existingUser.length === 0) {
    await MysqlDatasource.query(
      `INSERT INTO user (name, email, password, role_id, status, session_version, created_by, updated_by)
       VALUES (?, ?, ?, 2, 1, 0, 1, 1)`,
      ['John Employee', 'user@hris.com', passwordHash]
    );
    console.log('Created default employee: user@hris.com / @Mohammad842');
  } else {
    console.log('Employee already exists.');
  }

  await MysqlDatasource.destroy();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

import '../env.js';
import { MysqlDatasource } from './datasource/MysqlDatasource.js';
import { seedUsers } from './seeders/user.seeder.js';

async function main() {
  const args = process.argv.slice(2);
  let extraCount = 0;
  let customPassword: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      extraCount = Number(args[i + 1]) || 0;
    }
    if (args[i] === '--password' && args[i + 1]) {
      customPassword = args[i + 1];
    }
  }

  console.log('Connecting to database...');
  await MysqlDatasource.initialize();

  try {
    await seedUsers(MysqlDatasource, {
      extraCount,
      defaultPassword: customPassword,
    });
  } finally {
    if (MysqlDatasource.isInitialized) {
      await MysqlDatasource.destroy();
    }
  }
}

main().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});

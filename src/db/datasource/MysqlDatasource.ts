import { DataSource } from "typeorm";
import { Attendance } from "../../attendance/entities/attendance.entity.js";
import { User } from "../../user/entities/user.entity.js";
import { Role } from "../../role/entities/role.entity.js";
if (typeof process.loadEnvFile === 'function') {
    try {
        process.loadEnvFile();
    } catch {
        // Ignore if .env is missing (e.g., provided via environment)
    }
}

export const MysqlDatasource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Attendance, User, Role],
    migrations: ['src/db/migrations/*.ts'],
    synchronize: false,
    logging: true
})
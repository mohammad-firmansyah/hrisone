import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthAttendance1792133415124 implements MigrationInterface {
    name = 'AuthAttendance1792133415124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // FKs must go first: MySQL refuses to drop an index a FK depends on.
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_fb2e442d14add3cefbdf33c4561\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP FOREIGN KEY \`FK_0bedbcc8d5f9b9ec4979f519597\``);
        await queryRunner.query(`DROP INDEX \`REL_fb2e442d14add3cefbdf33c456\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`REL_0bedbcc8d5f9b9ec4979f51959\` ON \`attendance\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`location\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`image\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`session_version\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`type\` varchar(20) NOT NULL DEFAULT 'WFH'`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`clock_in_latitude\` decimal(10,7) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`clock_in_longitude\` decimal(10,7) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`clock_in_image\` varchar(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`clock_out_latitude\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`clock_out_longitude\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`clock_out_image\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`role_id\` \`role_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`notes\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`notes\` varchar(500) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` CHANGE \`clock_out\` \`clock_out\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` CHANGE \`user_id\` \`user_id\` int NOT NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_47fb2e39840d90c1090ca92aed\` ON \`attendance\` (\`user_id\`, \`clock_in\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_fb2e442d14add3cefbdf33c4561\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD CONSTRAINT \`FK_0bedbcc8d5f9b9ec4979f519597\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP FOREIGN KEY \`FK_0bedbcc8d5f9b9ec4979f519597\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_fb2e442d14add3cefbdf33c4561\``);
        await queryRunner.query(`DROP INDEX \`IDX_47fb2e39840d90c1090ca92aed\` ON \`attendance\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` CHANGE \`user_id\` \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` CHANGE \`clock_out\` \`clock_out\` datetime NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`notes\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`notes\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD CONSTRAINT \`FK_0bedbcc8d5f9b9ec4979f519597\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`role_id\` \`role_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_fb2e442d14add3cefbdf33c4561\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`clock_out_image\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`clock_out_longitude\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`clock_out_latitude\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`clock_in_image\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`clock_in_longitude\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`clock_in_latitude\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP COLUMN \`type\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`session_version\``);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`image\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD \`location\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_0bedbcc8d5f9b9ec4979f51959\` ON \`attendance\` (\`user_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_fb2e442d14add3cefbdf33c456\` ON \`user\` (\`role_id\`)`);
    }

}

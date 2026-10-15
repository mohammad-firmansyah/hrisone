import { MigrationInterface, QueryRunner } from "typeorm";

export class BulkyHulk1792031884687 implements MigrationInterface {
    name = 'BulkyHulk1792031884687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`role\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`created_by\` int NOT NULL, \`updated_by\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`status\` tinyint NOT NULL, \`created_by\` int NOT NULL, \`updated_by\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`role_id\` int NULL, UNIQUE INDEX \`REL_fb2e442d14add3cefbdf33c456\` (\`role_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`attendance\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_by\` int NOT NULL, \`updated_by\` int NOT NULL, \`location\` varchar(255) NOT NULL, \`image\` varchar(255) NOT NULL, \`notes\` varchar(255) NOT NULL, \`clock_in\` datetime NOT NULL, \`clock_out\` datetime NOT NULL, \`user_id\` int NULL, UNIQUE INDEX \`REL_0bedbcc8d5f9b9ec4979f51959\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_fb2e442d14add3cefbdf33c4561\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendance\` ADD CONSTRAINT \`FK_0bedbcc8d5f9b9ec4979f519597\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendance\` DROP FOREIGN KEY \`FK_0bedbcc8d5f9b9ec4979f519597\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_fb2e442d14add3cefbdf33c4561\``);
        await queryRunner.query(`DROP INDEX \`REL_0bedbcc8d5f9b9ec4979f51959\` ON \`attendance\``);
        await queryRunner.query(`DROP TABLE \`attendance\``);
        await queryRunner.query(`DROP INDEX \`REL_fb2e442d14add3cefbdf33c456\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`role\``);
    }

}

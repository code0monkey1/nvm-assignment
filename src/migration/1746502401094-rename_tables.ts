import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTables1746502401094 implements MigrationInterface {
    name = 'RenameTables1746502401094';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameTable('user', 'users');
        await queryRunner.renameTable('refresh_token', 'refreshTokens');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // revert the previous changes
        await queryRunner.renameTable('users', 'user');
        await queryRunner.renameTable('refreshTokens', 'refresh_token');
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT "FK_265bec4e500714d5269580a0219"`,
        );
    }
}

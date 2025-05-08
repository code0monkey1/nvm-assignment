import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlankFile1746721631506 implements MigrationInterface {
    name = 'BlankFile1746721631506';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First drop the existing foreign key constraint if it exists
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT IF EXISTS "FK_265bec4e500714d5269580a0219"`,
        );

        // Add the new foreign key constraint with CASCADE delete
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_265bec4e500714d5269580a0219" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the cascade delete constraint
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" DROP CONSTRAINT IF EXISTS "FK_265bec4e500714d5269580a0219"`,
        );

        // Restore the original NO ACTION constraint
        await queryRunner.query(
            `ALTER TABLE "refreshTokens" ADD CONSTRAINT "FK_265bec4e500714d5269580a0219" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
}

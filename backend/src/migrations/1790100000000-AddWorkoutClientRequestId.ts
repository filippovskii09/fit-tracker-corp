import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkoutClientRequestId1790100000000 implements MigrationInterface {
  name = 'AddWorkoutClientRequestId1790100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workouts" ADD "clientRequestId" character varying`,
    );

    // SHA-256 of the canonicalized create payload; lets a repeated
    // clientRequestId with a different payload be rejected (409) instead of
    // silently returning stale data.
    await queryRunner.query(
      `ALTER TABLE "workouts" ADD "payloadHash" character varying`,
    );

    // Nullable column: legacy rows/requests without a clientRequestId keep
    // multiple NULLs, which Postgres unique indexes treat as distinct values.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workouts_userId_clientRequestId" ON "workouts" ("userId", "clientRequestId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_workouts_userId_clientRequestId"`);
    await queryRunner.query(`ALTER TABLE "workouts" DROP COLUMN "payloadHash"`);
    await queryRunner.query(
      `ALTER TABLE "workouts" DROP COLUMN "clientRequestId"`,
    );
  }
}

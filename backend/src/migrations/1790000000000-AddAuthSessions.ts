import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSessions1790000000000 implements MigrationInterface {
  name = 'AddAuthSessions1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth_sessions" (
        "id" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "currentTokenHash" character varying NOT NULL,
        "previousTokenHash" character varying,
        "previousTokenExpiresAt" TIMESTAMPTZ,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "revokedAt" TIMESTAMPTZ,
        "lastUsedAt" TIMESTAMPTZ,
        "userAgent" character varying(256),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_sessions_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`,
    );

    // Every session-scoped refresh/revoke/logout lookup is by userId
    // (list active sessions for a user) or by primary key (single session).
    await queryRunner.query(
      `CREATE INDEX "IDX_auth_sessions_userId" ON "auth_sessions" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_auth_sessions_userId"`);
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
  }
}

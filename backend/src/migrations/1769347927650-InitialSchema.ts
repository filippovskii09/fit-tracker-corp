import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1769347927650 implements MigrationInterface {
  name = 'InitialSchema1769347927650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TYPE "public"."exercises_musclegroup_enum" AS ENUM('Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Cardio', 'Full Body')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "muscleGroup" "public"."exercises_musclegroup_enum" NOT NULL DEFAULT 'Full Body', "userId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a521b5cac5648eedc036e17d1bd" UNIQUE ("name"), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_sets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "weight" double precision NOT NULL, "reps" integer NOT NULL, "order" integer NOT NULL, "isCompleted" boolean NOT NULL DEFAULT false, "workoutExerciseId" uuid, CONSTRAINT "PK_5ad75c97e58e8c660a48926d438" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "date" TIMESTAMP NOT NULL, "userId" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'COMPLETED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b2319bf64a674d40237dbb1697" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order" integer NOT NULL, "exerciseId" uuid NOT NULL, "workoutId" uuid, CONSTRAINT "PK_377f9ead6fd69b29f0d0feb1028" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_5b4de620970471d3efe408b8e81" FOREIGN KEY ("workoutExerciseId") REFERENCES "workout_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_d616bcfffe0b6bb322281ae3754" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" ADD CONSTRAINT "FK_1222e38fcd49c77d6ae78c6b073" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_1222e38fcd49c77d6ae78c6b073"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_exercises" DROP CONSTRAINT "FK_d616bcfffe0b6bb322281ae3754"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_5b4de620970471d3efe408b8e81"`,
    );
    await queryRunner.query(`DROP TABLE "workout_exercises"`);
    await queryRunner.query(`DROP TABLE "workouts"`);
    await queryRunner.query(`DROP TABLE "workout_sets"`);
    await queryRunner.query(`DROP TABLE "exercises"`);
    await queryRunner.query(`DROP TYPE "public"."exercises_musclegroup_enum"`);
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { envSchema } from '@src/config/env.validation';
import { DBModule } from '@src/db/db.module';
import { UsersModule } from '@src/users/users.module';
import { AuthModule } from '@src/auth/auth.module';
import { ExercisesModule } from '@src/exercises/exercises.module';
import { WorkoutsModule } from '@src/workouts/workouts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
      envFilePath: '.env',
    }),
    DBModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    UsersModule,
    AuthModule,
    ExercisesModule,
    WorkoutsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

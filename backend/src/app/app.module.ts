import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envSchema } from '@src/config/env.validation';
import { DBModule } from '@src/db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
      envFilePath: '.env',
    }),
    DBModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

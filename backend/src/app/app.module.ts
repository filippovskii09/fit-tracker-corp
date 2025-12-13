import { Module } from '@nestjs/common';

import { DBModule } from '@src/db/db.module';

@Module({
  imports: [DBModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

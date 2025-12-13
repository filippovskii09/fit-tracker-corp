import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DBService implements OnModuleInit {
  private readonly logger = new Logger(DBService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      if (this.dataSource.isInitialized) {
        this.logger.log('Database already initialized');
      } else {
        await this.dataSource.initialize();
        this.logger.log('Database connection established successfully');
      }
    } catch (error) {
      this.logger.error('Database connection failed:', error.message);
      throw error;
    }
  }
}

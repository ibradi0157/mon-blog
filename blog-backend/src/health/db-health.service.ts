// src/health/db-health.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DbHealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async check() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok' };
    } catch (e) {
      return { status: 'error', message: e?.message ?? 'unknown error' };
    }
  }
}

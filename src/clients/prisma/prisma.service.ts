import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['info', 'warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    while (true) {
      try {
        await this.$disconnect();
        this.logger.log('Prisma disconnected successfully.');
        break;
      } catch (err) {
        this.logger.warn(
          'Failed to disconnect Prisma, retrying in 4 seconds...',
          err,
        );
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }
  }
}

import { Module } from '@nestjs/common';
import { BasicOperationModule } from './basic-operation/basic-operation.module';

@Module({
  imports: [BasicOperationModule],
})
export class BotModule {}

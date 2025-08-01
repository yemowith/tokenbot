import { Module } from '@nestjs/common';
import { TokenTransferModule } from './token-transfer/token-transfer.module';
import { SwapModule } from './swap/swap.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [TokenTransferModule, SwapModule, BotModule],
  exports: [TokenTransferModule],
  providers: [],
})
export class OperationsModule {}

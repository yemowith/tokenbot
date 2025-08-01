import { Module } from '@nestjs/common';
import { SwapService } from './swap.service';
import { TokenTransferModule } from '../token-transfer/token-transfer.module';

@Module({
  providers: [SwapService],
  exports: [SwapService],
  imports: [TokenTransferModule],
})
export class SwapModule {}

import { Module } from '@nestjs/common';
import { BasicOperationService } from './basic-operation.service';
import { TokenTransferModule } from 'src/operations/token-transfer/token-transfer.module';
import { SwapModule } from 'src/operations/swap/swap.module';

@Module({
  imports: [TokenTransferModule, SwapModule],
  providers: [BasicOperationService],
  exports: [BasicOperationService],
})
export class BasicOperationModule {}

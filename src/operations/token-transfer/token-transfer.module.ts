import { Module } from '@nestjs/common';
import { TokenTransferService } from './token-transfer.service';

@Module({
  providers: [TokenTransferService],
  exports: [TokenTransferService],
})
export class TokenTransferModule {}

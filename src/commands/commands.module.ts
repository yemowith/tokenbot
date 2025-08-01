import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { PrismaModule } from 'src/clients/prisma/prisma.module';
import { WalletCommand } from './wallet/wallet.command';
import { TestCommand } from './test/test.command';

import { Web3Module } from 'src/clients/web3/web3.module';
import { OperationsModule } from 'src/operations/operations.module';
import { SwapService } from 'src/operations/swap/swap.service';
import { BasicOperationService } from 'src/operations/bot/basic-operation/basic-operation.service';

@Module({
  providers: [WalletCommand, TestCommand, SwapService, BasicOperationService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    Web3Module,
    OperationsModule,
  ],
})
export class CommandsModule {}

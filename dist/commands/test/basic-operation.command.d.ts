import { CommandRunner } from 'nest-commander';
import { BasicOperationService } from '../../operations/bot/basic-operation/basic-operation.service';
export declare class BasicOperationCommand extends CommandRunner {
    private readonly basicOperationService;
    constructor(basicOperationService: BasicOperationService);
    run(): Promise<void>;
}

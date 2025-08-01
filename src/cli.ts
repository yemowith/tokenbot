import 'tsconfig-paths/register'; // Bu çok önemli
import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './commands/commands.module';

async function bootstrap() {
  await CommandFactory.run(CommandsModule, ['warn', 'error']);
}

bootstrap();

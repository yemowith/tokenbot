"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("tsconfig-paths/register");
const nest_commander_1 = require("nest-commander");
const commands_module_1 = require("./commands/commands.module");
async function bootstrap() {
    await nest_commander_1.CommandFactory.run(commands_module_1.CommandsModule, ['warn', 'error']);
}
bootstrap();
//# sourceMappingURL=cli.js.map
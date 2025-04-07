import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

//define commands
const commands = [
  { name: 'reflections', description: "Get today's AA daily reflection" },
  { name: 'ping', description: 'Replies with pong!' },
];
export { commands };

/** Create Discord slash commands objects from commands array above
 * @param commands - The commands to create slash commands from
 */
const slashCommands = commands.map((command) =>
  new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description),
);
const rest = new REST({ version: '10' }).setToken(
  process.env.DISCORD_BOT_TOKEN,
);

//deploy commands
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: slashCommands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

//confirm commands deployment
(async () => {
  try {
    console.log('Fetching registered commands...');

    const commands = await rest.get(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    );

    console.log('Registered commands:');
    commands.forEach((command) => {
      console.warn(`/${command.name} - ${command.description}`);
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
  }
})();

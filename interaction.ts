import { type Interaction, type Collection } from "discord.js";
import type { Logger } from "pino";
import type { Command } from "../commands/index.js";

export async function handleInteraction(interaction: Interaction, commands: Collection<string, Command>, logger: Logger) {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) { await interaction.reply({ content: "Unknown command!", ephemeral: true }); return; }
  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error({ err, commandName: interaction.commandName }, "Error executing command");
    const msg = { content: "There was an error executing this command!", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
}

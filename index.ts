import { Client, GatewayIntentBits, Events, type Interaction, type GuildMember } from "discord.js";
import pino from "pino";
import { commands } from "./commands/index.js";
import { handleInteraction } from "./handlers/interaction.js";
const logger = pino({ transport: process.env["NODE_ENV"] !== "production" ? { target: "pino-pretty" } : undefined });
const token = process.env["DISCORD_BOT_TOKEN"];
if (!token) { logger.error("DISCORD_BOT_TOKEN required"); process.exit(1); }
process.on("uncaughtException", (err) => logger.error({ err }, "Uncaught exception — keeping alive"));
process.on("unhandledRejection", (reason) => logger.error({ reason }, "Unhandled rejection — keeping alive"));
const useGuildMembers = process.env["ENABLE_GUILD_MEMBERS_INTENT"] === "true";
function createClient() {
  return new Client({ intents: [GatewayIntentBits.Guilds, ...(useGuildMembers ? [GatewayIntentBits.GuildMembers] : [])] });
}
async function start() {
  const client = createClient();
  client.once(Events.ClientReady, (r) => logger.info(`Logged in as ${r.user.tag}`));
  client.on(Events.InteractionCreate, async (i: Interaction) => await handleInteraction(i, commands, logger));
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const role = member.guild.roles.cache.find((r) => r.name === "MC Member");
    if (!role) return;
    await member.roles.add(role, "Auto-role on join").catch(() => null);
  });
  client.on(Events.Error, (e) => logger.error({ err: e }, "Client error"));
  client.on(Events.ShardDisconnect, (_e, shardId) => {
    logger.warn({ shardId }, "Disconnected — reconnecting in 5s");
    setTimeout(() => { client.destroy(); start().catch(() => null); }, 5000);
  });
  await client.login(token);
}
start().catch(() => setTimeout(() => start(), 10_000));

require('dotenv').config(); // LOAD CONFIG (.env)
import { DiscordClient } from '@src/structures';
import { GatewayIntentBits, Partials, REST } from 'discord.js';

import { DBConnection } from './class/database/dbConnection.db.class';
import { ModerationModule } from './modules/Moderation.module';
import { TicketModule } from './modules/Ticket.module';
import databaseSynchronisation from './structures/database/sync.db';

const config = {
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.AutoModerationExecution,
	],
	partials: [
		Partials.Channel,
		Partials.GuildMember,
		Partials.Message,
		Partials.User,
		Partials.Reaction,
	],
	allowedMentions: {
		parse: ['users', 'roles', 'everyone'],
		repliedUser: true,
	},
};

async function main() {
	DBConnection.getInstance()
		.sequelize.authenticate()
		.then(async () => {
			await databaseSynchronisation();
			console.info('Starting bot...');
			if (!process.env.DISCORD_BOT_TOKEN)
				throw new Error('DISCORD_BOT_TOKEN is not defined in .env');
			if (!process.env.DISCORD_BOT_PREFIX)
				throw new Error('DISCORD_BOT_PREFIX is not defined in .env');
			if (!process.env.DISCORD_BOT_APP_ID)
				throw new Error('DISCORD_BOT_APP_ID is not defined in .env');

			const rest = new REST({ version: '10' }).setToken(
				process.env.DISCORD_BOT_TOKEN,
			);
			const baseClient = new DiscordClient(
				config,
				process.env.DISCORD_BOT_PREFIX,
				process.env.DISCORD_BOT_APP_ID,
				rest,
				process.env.AUTHOR_ID,
			);
			// Loading every modules the bot has
			console.info('Loading modules...');
			const allModules = [TicketModule, ModerationModule];
			for (const module of allModules) {
				baseClient.addModule(new module());
			}
			// Loading every registered modules
			await baseClient.loadModules();
			// Loading every events the bot has
			await baseClient.loadEvents();
			await baseClient.run(process.env.DISCORD_BOT_TOKEN);
		})
		.catch((err) => {
			console.error(err);
		});
}

main();

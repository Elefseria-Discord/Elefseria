require('dotenv').config();
const { Client, Intents } = require('discord.js');
const FunModule = require('./modules/FunModule');
const GiveawayModule = require('./modules/GiveawayModule');
const ModerationModule = require('./modules/ModerationModule');
const ReactionRoleModule = require('./modules/ReactionRoleModule');
const SecurityModule = require('./modules/SecurityModule');
const SettingsModule = require('./modules/SettingsModule');
const TicketModule = require('./modules/TicketModule');
const { registerEvents } = require('./utils/registry');
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS
	], partials: [
		"GUILD_MEMBER",
		"USER",
		"MESSAGE",
		"REACTION"
	]
});

(async () => {
	const paths = new Array("fun", "giveaway", "moderation", "reactionrole", "security", "settings", "ticket");
	client.modules = new Set([
		new FunModule(),
		new GiveawayModule(),
		new ModerationModule(),
		new ReactionRoleModule(),
		new SecurityModule(),
		new SettingsModule(),
		new TicketModule()
	]);
	client.mutes = require("./utils/json/mute.json");
	client.cachedMessageReactions = new Map();
	client.events = new Map();
	client.cooldown = new Map();
	client.events = new Map();
	client.prefix = process.env.DISCORD_BOT_PREFIX;
	var i = 0;
	for (var module of client.modules) {
		await module.loadCommands("../commands/" + paths[i]);
		i++;
	};
	await registerEvents(client, '../events');
	await client.login(process.env.DISCORD_BOT_TOKEN);
})();


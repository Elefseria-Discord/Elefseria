import { BaseEvent, DiscordClient } from '@src/structures';
import { EmbedBuilder, Events, Message, TextChannel } from 'discord.js';
import { Colors } from 'discord.js';

/**
 * @description MessageCreated event
 * @class MessageCreatedEvent
 * @extends BaseEvent
 * @method execute - Executes the event
 */
export class MessageCreatedEvent extends BaseEvent {
	constructor() {
		super(Events.MessageCreate, false);
	}

	async execute(client: DiscordClient, message: Message) {
		// SKIP IF AUTHOR IS BOT
		if (message.author.bot) return;
		if (
			message.mentions.has(client.user!) &&
			message.author.id !== client.getAuthorId()
		) {
			message.reply(
				`My prefix is \`${client.getPrefix()}\`, don't forget it!`,
			);
		}
		if (
			message.mentions.has(client.user!) &&
			message.author.id === client.getAuthorId()
		) {
			const info = client.getInfo();
			const username = client.users.cache.get(client.getAuthorId())?.tag;

			const embed = new EmbedBuilder()
				.setTitle('Bot Info')
				.setDescription('Here is some information about me')
				.setColor(Colors.Orange)
				.setTimestamp()
				.addFields([
					{ name: 'Prefix', value: info.prefix, inline: true },
					{
						name: 'Modules',
						value: info.modules.size.toString(),
						inline: true,
					},
					{
						name: 'Author',
						value: username ? username : 'Not found',
						inline: true,
					},
				]);

			for (const [, value] of info.modules.entries()) {
				embed.addFields([
					{ name: 'Module', value: value.name, inline: true },
					{
						name: 'Commands',
						value: value.getCommands().size.toString(),
						inline: true,
					},
					{
						name: 'Button Interactions',
						value: value.getButtonInteractions().size.toString(),
						inline: true,
					},
					{
						name: 'Modal Interactions',
						value: value.getModalInteractions().size.toString(),
						inline: true,
					},
				]);
			}
			if (message.author.avatarURL())
				embed.setFooter({
					text: `Developed by ${username ? username : 'No one'}`,
					iconURL: `${message.author.avatarURL()}`,
				});
			else
				embed.setFooter({
					text: `Developed by ${username ? username : 'No one'}`,
				});
			(message.channel as TextChannel).send({
				content: 'Hello, my master !',
				embeds: [embed],
			});
		}

		// SKIP IF MESSAGE DOES NOT START WITH PREFIX
		if (message.content.startsWith(client.getPrefix())) {
			const [commandName, ...args] = message.content
				.slice(client.getPrefix().length)
				.trim()
				.split(/ +/g);
			for (const module of client.getModules().values()) {
				if (!module.hasCommand(commandName)) continue;
				if (
					!module.isEnabled ||
					!module.getCommand(commandName)!.isEnabled
				)
					continue;
				const command = module.getCommand(commandName);
				if (command) {
					try {
						console.info(
							`Command ${commandName} executed by ${message.author.tag}`,
						);
						await command.execute(client, message, args);
					} catch (error) {
						console.error(error);
						message.reply(
							'Call the developer, something went wrong!',
						);
					}
				}
			}
		}
	}
}

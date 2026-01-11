import { BaseCommand, DiscordClient } from '@src/structures';
import { Collection, Message, TextChannel } from 'discord.js';
import ms from 'ms';

/**
 * @description TicketCreate command
 * @class TicketCreate
 * @extends BaseCommand
 */
export class PurgeCommand extends BaseCommand {
	constructor() {
		super(
			'purgeuser',
			[],
			'Moderation',
			'Purge user messages from this channel',
			'<user> <count>',
			0,
			true,
			[],
		);
	}

	/**
	 * @description Executes the command
	 * @param {DiscordClient} _client
	 * @param {Message} message
	 * @param {string[]} args
	 * @returns {Promise<void>}
	 */
	async execute(
		_client: DiscordClient,
		message: Message,
		args: string[],
	): Promise<void> {
		if (args.length < 2) {
			message.reply(
				'Please specify a user and number of messages to purge',
			);
			return;
		}
		const user =
			message.mentions.users.first() ||
			message.guild?.members.cache.get(args[0])?.user;
		if (!user) {
			message.reply('Please specify a valid user');
			return;
		}
		const count = parseInt(args[1]);
		if (isNaN(count)) {
			message.reply('Please specify a valid number of messages to purge');
			return;
		}
		if (count < 1) {
			message.reply('Please specify a number of messages to purge');
			return;
		}
		let messagesToDelete = new Collection<string, Message>();
		for (let i = 100; i < count; i += 100) {
			const messages = await message.channel.messages.fetch({
				limit: 100,
				after:
					messagesToDelete.size === 0
						? message.id
						: messagesToDelete.lastKey()!,
			});
			messagesToDelete = messagesToDelete.concat(
				messages.reduce((acc, m) => {
					if (m.author.id === user.id) acc.set(m.id, m);
					return acc;
				}, new Collection<string, Message>()),
			);
		}
		for (const msg of messagesToDelete.values()) {
			msg.delete();
		}
		const msg = await (message.channel as TextChannel).send({
			content: `Purged ${messagesToDelete.size} messages from **${user.tag}**`,
		});
		setTimeout(() => {
			msg.delete();
		}, ms('5s'));
	}
}

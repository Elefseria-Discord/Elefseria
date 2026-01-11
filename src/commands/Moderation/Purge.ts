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
			'purge',
			[],
			'Moderation',
			'Purge messages from a channel',
			'<count>',
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
		if (args.length == 0) {
			message.reply('Please specify a number of messages to purge');
			return;
		}
		let count = parseInt(args[0]);
		if (isNaN(count)) {
			message.reply('Please specify a valid number of messages to purge');
			return;
		}
		if (count < 1) {
			message.reply('Please specify a number of messages to purge');
			return;
		}
		let messagesToDelete = new Collection<string, Message>();
		while (count > 100) {
			const msgs = await message.channel.messages.fetch({
				limit: 100,
				before: messagesToDelete.lastKey(),
			});
			messagesToDelete = messagesToDelete.concat(msgs);
			count -= 100;
		}
		for (const msg of messagesToDelete.values()) {
			await msg.delete();
		}
		const channel = message.channel as TextChannel;
		const msg = await channel.send({
			content: `Purged ${count} messages`,
		});
		setTimeout(() => {
			msg.delete();
		}, ms('5s'));
	}
}

import { BaseCommand, DiscordClient } from '@src/structures';
import { Message } from 'discord.js';
import ms from 'ms';

/**
 * @description TicketCreate command
 * @class TicketCreate
 * @extends BaseCommand
 */
export class TimeoutCommand extends BaseCommand {
	constructor() {
		super(
			'timeout',
			[],
			'Moderation',
			'Timeout an user',
			'<user> <duration> <reason>',
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
		const user = message.mentions.users.first();
		const duration = args[1];
		const reason = args.slice(2).join(' ');
		if (!user || !duration || !reason || !ms(duration)) {
			message.reply('Please specify a user, a duration and a reason');
			return;
		}
		const member = message.guild?.members.cache.get(user.id);
		if (!member) {
			message.reply('Please specify a valid user');
			return;
		}
		if (!member.kickable) {
			message.reply('I cannot timeout this user');
			return;
		}
		member.timeout(ms(duration), reason);
		message.reply(
			`**${user.tag}** has been timeouted by **${message.author.tag}** for **${reason}**`,
		);
	}
}

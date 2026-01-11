import { BaseCommand, DiscordClient } from '@src/structures';
import { Message } from 'discord.js';

/**
 * @description TicketCreate command
 * @class TicketCreate
 * @extends BaseCommand
 */
export class KickCommand extends BaseCommand {
	constructor() {
		super(
			'kick',
			[],
			'Moderation',
			'Kick an user',
			'<user> <reason>',
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
		const reason = args.slice(1).join(' ');
		if (!user || !reason) {
			message.reply('Please specify a user and a reason');
			return;
		}
		const member = message.guild?.members.cache.get(user.id);
		if (!member) {
			message.reply('Please specify a valid user');
			return;
		}
		if (!member.kickable) {
			message.reply('I cannot kick this user');
			return;
		}
		member.kick(reason);
		message.reply(
			`**${user.tag}** has been kickned by **${message.author.tag}** for **${reason}**`,
		);
	}
}

import {
	BaseSlashCommand,
	DiscordClient,
	SlashCommandOptionType,
} from '@src/structures';
import { ChatInputCommandInteraction } from 'discord.js';

export class TimeoutSlashCommand extends BaseSlashCommand {
	constructor() {
		super(
			'timeout',
			'Timeout an user',
			'Moderation',
			[
				{
					name: 'user',
					description:
						'The user you want to delete the messages from',
					type: SlashCommandOptionType.USER,
					required: true,
				},
				{
					name: 'duration',
					description: 'The duration of the timeout',
					type: SlashCommandOptionType.INTEGER,
					required: true,
				},
				{
					name: 'reason',
					description: 'The reason for the timeout',
					type: SlashCommandOptionType.STRING,
				},
			],
			true,
		);
	}

	async execute(
		_client: DiscordClient,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const duration = interaction.options.getInteger('duration') as number;
		const user = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason') ?? '';
		if (!user || !duration) {
			interaction.reply('Please specify a user, a duration and a reason');
			return;
		}
		const member = interaction.guild?.members.cache.get(user.id);
		if (!member) {
			await interaction.reply('Please specify a valid user');
			return;
		}
		if (!member.kickable) {
			await interaction.reply('I cannot timeout this user');
			return;
		}
		await member.timeout(duration, reason);
		await interaction.reply(
			`**${user.tag}** has been timeouted by **${interaction.user.tag}** for **${reason}**`,
		);
	}
}

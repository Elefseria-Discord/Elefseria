import {
	BaseSlashCommand,
	DiscordClient,
	SlashCommandOptionType,
} from '@src/structures';
import { ChatInputCommandInteraction } from 'discord.js';

export class KickSlashCommand extends BaseSlashCommand {
	constructor() {
		super(
			'kick',
			'Kick an user from the server',
			'Moderation',
			[
				{
					name: 'user',
					description: 'The user to kick',
					type: SlashCommandOptionType.USER,
					required: true,
				},
				{
					name: 'reason',
					description: 'The reason for the kick',
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
		const user = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason');
		if (!user || !reason) {
			interaction.reply({
				content: 'Please specify a user and a reason',
				ephemeral: true,
			});
			return;
		}
		const member = interaction.guild?.members.cache.get(user.id);
		if (!member) {
			await interaction.reply({
				content: 'This command can only be used in a server',
				ephemeral: true,
			});
			return;
		}
		if (!member.kickable) {
			await interaction.reply({
				content: 'This command can only be used in a server',
				ephemeral: true,
			});
			return;
		}
		member.kick(reason);
		await interaction.reply({
			content: `**${user.tag}** has been banned by **${interaction.user.tag}** for **${reason}**`,
		});
	}
}

import {
	BaseSlashCommand,
	DiscordClient,
	SlashCommandOptionType,
} from '@src/structures';
import { ChatInputCommandInteraction } from 'discord.js';

export class WhoisSlashCommand extends BaseSlashCommand {
	constructor() {
		super(
			'whois',
			'Get information about a user',
			'Moderation',
			[
				{
					name: 'user',
					description:
						'The user you want to delete the messages from',
					type: SlashCommandOptionType.USER,
					required: false,
				},
			],
			true,
		);
	}

	async execute(
		_client: DiscordClient,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const user = interaction.options.getUser('user') ?? interaction.user;
		const member = interaction.guild?.members.cache.get(user.id);
		const embed = {
			color: 0x00ff00,
			title: `Information about ${user.tag}`,
			thumbnail: {
				url: user.displayAvatarURL({ extension: 'png', size: 64 }),
			},
			fields: [
				{
					name: 'ID',
					value: user.id,
					inline: true,
				},
				{
					name: 'Username',
					value: user.username,
					inline: true,
				},
				{
					name: 'Bot',
					value: user.bot ? 'Yes' : 'No',
					inline: true,
				},
				{
					name: 'Created At',
					value: user.createdAt.toUTCString(),
					inline: true,
				},
				{
					name: 'Joined At',
					value: member?.joinedAt?.toUTCString() || 'Unknown',
					inline: true,
				},
				{
					name: 'Roles',
					value:
						member && member.roles.cache.size > 0
							? member.roles.cache
									.filter((role) => role.name !== '@everyone')
									.map((role) => role.toString())
									.join(' ')
							: 'Unknown or no roles found',
					inline: true,
				},
			],
		};
		await interaction.reply({ embeds: [embed] });
	}
}

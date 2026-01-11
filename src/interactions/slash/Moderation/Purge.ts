import {
	BaseSlashCommand,
	DiscordClient,
	SlashCommandOptionType,
} from '@src/structures';
import { ChatInputCommandInteraction, Collection, Message } from 'discord.js';
import ms from 'ms';

export class PurgeSlashCommand extends BaseSlashCommand {
	constructor() {
		super(
			'purge',
			'Purge message from a channel',
			'Moderation',
			[
				{
					name: 'count',
					description: 'The number of message to delete',
					type: SlashCommandOptionType.INTEGER,
					required: true,
				},
			],
			true,
		);
	}

	async execute(
		_client: DiscordClient,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		let count = interaction.options.getInteger('count') as number;
		if (isNaN(count)) {
			interaction.reply({
				content: 'Please specify a valid number of messages to purge',
				ephemeral: true,
			});
			return;
		}
		if (count < 1) {
			interaction.reply({
				content: 'Please specify a number of messages to purge',
				ephemeral: true,
			});
			return;
		}
		let messagesToDelete = new Collection<string, Message>();
		while (count > 100) {
			const msgs = await interaction.channel!.messages.fetch({
				limit: 100,
				before: messagesToDelete.lastKey(),
			});
			messagesToDelete = messagesToDelete.concat(msgs);
			count -= 100;
		}
		for (const msg of messagesToDelete.values()) {
			await msg.delete();
		}
		const msg = await interaction.reply({
			content: `Purged ${count} messages`,
			ephemeral: true,
		});
		setTimeout(async () => {
			await msg.delete();
		}, ms('5s'));
	}
}

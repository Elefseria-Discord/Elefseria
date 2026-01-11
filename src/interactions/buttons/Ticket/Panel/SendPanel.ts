import { TicketHandler } from '@src/class/ticket/TicketHandler.class';
import { DiscordClient } from '@src/structures';
import { BaseButtonInteraction } from '@src/structures/base/BaseButtonInteraction.class';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	EmbedBuilder,
	TextChannel,
} from 'discord.js';

export class SendPanelInteraction extends BaseButtonInteraction {
	constructor() {
		super('sendPanels', 'Send every panels', 'Ticket', 0);
	}

	public async execute(
		_client: DiscordClient,
		interaction: ButtonInteraction,
	): Promise<void> {
		const ticketHandler = TicketHandler.getInstance();
		const allPanels = await ticketHandler.getPanelsByGuildId(
			interaction.guildId!,
		);
		const allInvalidPanel = [];

		for (const panel of allPanels) {
			try {
				const textChannel = (await interaction.guild?.channels.fetch(
					panel.get('channelId') as string,
					{
						cache: true,
					},
				)) as TextChannel | null;
				if (!textChannel) {
					allInvalidPanel.push({
						name: panel.get('name') as string,
					});
					continue;
				}
				const embed = new EmbedBuilder()
					.setTitle(panel.get('name') as string)
					.setDescription(
						'If you want to open a ticket related to this panel, click on the button below.',
					)
					.setFooter({
						text: 'Powered by Elefseria - Manage your ticket easily than before',
					});
				const btn = new ButtonBuilder()
					.setCustomId('createTicket')
					.setLabel('Create Ticket')
					.setEmoji('📩')
					.setStyle(ButtonStyle.Primary);
				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
					btn,
				);
				await textChannel.send({
					embeds: [embed],
					components: [row],
				});
			} catch {
				allInvalidPanel.push({
					name: panel.get('name') as string,
				});
			}
		}
		if (allInvalidPanel.length > 0) {
			await interaction.reply({
				content: `The panels **${allInvalidPanel
					.map((invalidPanel) => invalidPanel.name)
					.join(
						', ',
					)}** couldn't be send because their respective channels were invalid`,
				ephemeral: true,
			});
		}
	}
}

import { TicketHandler } from '@src/class/ticket/TicketHandler.class';
import { BaseSlashCommand, DiscordClient } from '@src/structures';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} from 'discord.js';
import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Model } from 'sequelize';

export class SetupTicketSlashCommand extends BaseSlashCommand {
	constructor() {
		super(
			'setup',
			'Setup everything necessary to tickets',
			'Ticket',
			[],
			true,
			[
				PermissionFlagsBits.ManageChannels,
				PermissionFlagsBits.ManageRoles,
				PermissionFlagsBits.ManageGuild,
			],
		);
	}

	async execute(
		_client: DiscordClient,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const ticketHandler = TicketHandler.getInstance();
		const allPanels = await ticketHandler.getPanelsByGuildId(
			interaction.guildId!,
		);
		const activePanelNumber = allPanels.filter(
			(panel) => panel.get('status') === 1,
		).length;
		const { embed, actionRow } = SetupTicketSlashCommand.getSetupComponents(
			activePanelNumber,
			allPanels,
		);
		await interaction.reply({
			embeds: [embed],
			components: [actionRow],
			ephemeral: true,
		});
	}

	public static getSetupComponents = (
		activePanelNumber: number,
		allPanels: Model<any, any>[],
	) => {
		const embed = new EmbedBuilder()
			.setTitle('Ticket Basic Config Editor')
			.setDescription(
				"This is the basic config editor for setup and changes.\n\
                Please note that if you've got an unfinished panel you won't be able to add a new one.\n\
                Just finish it or delete it.",
			)
			.setColor('Random')
			.addFields([
				{
					name: 'Active panels',
					value: activePanelNumber.toString(),
					inline: true,
				},
				{
					name: 'Unfinished panel',
					value: allPanels
						.filter((panel) => panel.get('status') === 2)
						.length.toString(),
					inline: true,
				},
			]);

		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('addPanel')
				.setLabel('+ Add a panel')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId('removePanel')
				.setLabel('🗑️ Remove a panel')
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId('editPanel')
				.setLabel('✏️ Edit a panel')
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId('sendPanels')
				.setLabel('✅ Send panels')
				.setStyle(ButtonStyle.Success),
		);
		return {
			embed,
			actionRow,
		};
	};
}

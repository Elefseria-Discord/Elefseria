import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { TicketHandler } from '@src/class/ticket/TicketHandler.class';
import { BaseSlashCommand, DiscordClient } from '@src/structures';
import { ButtonStyle, ChatInputCommandInteraction } from 'discord.js';

/**
 * @description TicketOpen slash command
 * @class TicketOpen
 * @extends BaseSlashCommand
 */
export class TicketCloseRequestSlashCommand extends BaseSlashCommand {
	constructor() {
		super(
			'closerequest',
			"Send a request to close the current ticket you're in.",
			'Ticket',
		);
	}

	/**
	 * @description Executes the slash command
	 * @param {DiscordClient} client
	 * @param {ChatInputCommandInteraction} interaction
	 * @returns {Promise<void>}
	 */
	async execute(
		client: DiscordClient,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const ticketInstance = TicketHandler.getInstance();
		if (!interaction.guildId) {
			await interaction.reply({
				content: 'This command can only be used in a server',
				ephemeral: true,
			});
			return;
		}
		if (!interaction.channelId) {
			await interaction.reply({
				content:
					'This command can only be used in a channel, if you are in a ticket, try again discord may have not updated the channel id yet',
				ephemeral: true,
			});
			return;
		}
		if (!(await ticketInstance.isTicket(interaction.channelId))) {
			await interaction.reply({
				content: 'This channel is not a ticket',
				ephemeral: true,
			});
			return;
		}
		const ticket = await ticketInstance.getTicketByChannelId(
			interaction.channelId,
		);
		if (!ticket) {
			await interaction.reply({
				content: 'This ticket does not exist',
				ephemeral: true,
			});
			return;
		}
		if (ticket.get('status') === 0) {
			await interaction.reply({
				content: 'This ticket is already closed',
				ephemeral: true,
			});
			return;
		}
		const ticketChannel = await client.channels.fetch(
			ticket.get('channelId') as string,
		);
		if (!ticketChannel) {
			await interaction.reply({
				content: 'This ticket does not exist',
				ephemeral: true,
			});
			return;
		}
		const rowBtns = new ActionRowBuilder<ButtonBuilder>().setComponents(
			new ButtonBuilder()
				.setCustomId('closeTicket')
				.setLabel('Close')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('ticketCancel')
				.setLabel('Cancel')
				.setStyle(ButtonStyle.Danger),
		);
		await interaction.reply({
			content: 'Are you sure you want to close this ticket?',
			components: [rowBtns],
			ephemeral: true,
		});
	}
}

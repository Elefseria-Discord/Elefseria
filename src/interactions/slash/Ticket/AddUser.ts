import { TicketHandler } from '@src/class/ticket/TicketHandler.class';
import {
	BaseSlashCommand,
	DiscordClient,
	SlashCommandOptionType,
} from '@src/structures';
import { ChatInputCommandInteraction } from 'discord.js';

/**
 * @description TicketOpen slash command
 * @class TicketOpen
 * @extends BaseSlashCommand
 */
export class TicketAddUserSlashCommand extends BaseSlashCommand {
	constructor() {
		super(
			'adduser',
			'Add an user to this ticket',
			'Ticket',
			[
				{
					name: 'user',
					description: 'The user to add to the ticket',
					type: SlashCommandOptionType.USER,
					required: true,
				},
				{
					name: 'reason',
					description: 'The reason for adding the user',
					type: SlashCommandOptionType.STRING,
				},
			],
			true,
		);
	}

	/**
	 * @description Executes the slash command
	 * @param {DiscordClient} client
	 * @param {ChatInputCommandInteraction} interaction
	 * @returns {Promise<void>}
	 */
	async execute(
		_client: DiscordClient,
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const user = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason');
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
		if (!user) {
			await interaction.reply({
				content: 'You must provide a user to add to the ticket',
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
		ticketInstance
			.addUserToTicket(interaction.channel!, [user])
			.then(() => {
				interaction.reply({
					content: `The user ${user} has been added to the ticket for the reason \`${reason}\``,
				});
			})
			.catch((err) => {
				interaction.reply({
					content: `An error occurred while adding the user to the ticket: \`${err}\``,
					ephemeral: true,
				});
				return;
			});
	}
}

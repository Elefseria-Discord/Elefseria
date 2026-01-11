import buildTranscript from '@src/util/transcript';
import {
	AttachmentBuilder,
	Channel,
	ChannelType,
	Guild,
	PermissionFlagsBits,
	TextChannel,
	User,
} from 'discord.js';
import { Model } from 'sequelize';

import { Panel } from './Panel.class';
import { Ticket } from './ticket.class';

/**
 * This class handles everything related to tickets. It also manages panels.
 * It should be used to link discord and the database through the class made for Tickets and Panels.
 * @description TicketHandler class
 * @class TicketHandler
 */
export class TicketHandler {
	private static instance: TicketHandler;
	private static _ticket: Ticket = Ticket.getInstance();
	private static _panel: Panel = Panel.getInstance();

	private constructor() {}

	/**
	 * @description Returns the instance of the TicketHandler class
	 * @static
	 * @returns {TicketHandler} The instance of the TicketHandler class
	 */
	public static getInstance(): TicketHandler {
		if (TicketHandler.instance) {
			return TicketHandler.instance;
		}
		TicketHandler.instance = new TicketHandler();
		return TicketHandler.instance;
	}

	// ============================== TICKET ============================== //

	public async createTicket(
		panelId: string,
		guild: Guild,
		creator: User,
		roles: string[],
		categoryId: string | undefined,
	): Promise<{ ticket: Model<any, any>; channel: TextChannel }> {
		let channel: TextChannel | undefined;
		let nbrTickets: number | undefined;
		let ticket: Model<any, any> | undefined;
		try {
			nbrTickets = await TicketHandler._ticket.getTicketNbByGuildId(
				guild.id,
			);
			channel = await guild.channels.create({
				name: `ticket-${nbrTickets + 1}`,
				type: ChannelType.GuildText,
				parent: categoryId,
				permissionOverwrites: [
					{
						id: guild.roles.everyone,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: creator.id,
						allow: [
							PermissionFlagsBits.ViewChannel,
							PermissionFlagsBits.SendMessages,
						],
					},
				],
			});
			if (roles.length > 0 && roles[0] !== '') {
				for (const role of roles) {
					await channel.permissionOverwrites.create(role, {
						ViewChannel: true,
						SendMessages: true,
					});
				}
			}
			ticket = await TicketHandler._ticket.createTicket(
				panelId,
				creator.id,
				guild.id,
				channel.id,
			);
		} catch (error) {
			if (channel) {
				await channel.delete();
			}
			console.error(error);
			return Promise.reject(error);
		}
		return { ticket, channel };
	}

	public async getTicketByChannelId(
		channelId: string,
	): Promise<Model<any, any> | null> {
		return TicketHandler._ticket.getTicketByChannelId(channelId);
	}

	public async getTicketByGuildId(
		guildId: string,
	): Promise<Model<any, any>[]> {
		return TicketHandler._ticket.getTicketsByGuildId(guildId);
	}

	public async getTicketsByUserId(
		userId: string,
	): Promise<Model<any, any>[]> {
		return TicketHandler._ticket.getTicketsByUserId(userId);
	}

	public async isTicket(channelId: string): Promise<Model<any, any> | null> {
		return TicketHandler._ticket.getTicketByChannelId(channelId);
	}

	public async isTicketOpen(channel: Channel): Promise<boolean> {
		const ticket = await TicketHandler._ticket.getTicketByChannelId(
			channel.id,
		);
		if (ticket) {
			return ticket.get('status') as boolean;
		}
		return false;
	}

	public async isTicketClosed(channel: Channel): Promise<boolean> {
		const ticket = await TicketHandler._ticket.getTicketByChannelId(
			channel.id,
		);
		if (ticket) {
			return !(ticket.get('status') as boolean);
		}
		return false;
	}

	public async isTicketClaimedByUser(
		channel: Channel,
		user: User,
	): Promise<boolean> {
		const ticket = await TicketHandler._ticket.getTicketByChannelId(
			channel.id,
		);
		if (ticket) {
			if ((ticket.get('owner') as string).length === 0) return true;
			return ticket.get('owner') === user.id;
		}
		return false;
	}

	public async isTicketClaimed(
		channel: Channel,
		user: User,
	): Promise<boolean> {
		const ticket = await TicketHandler._ticket.getTicketByChannelId(
			channel.id,
		);
		if (ticket) {
			if (!ticket.get('owner')) return false;
			return (
				(ticket.get('owner') as string).length > 0 &&
				ticket.get('owner') !== user.id
			);
		}
		return false;
	}

	public async closeTicket(channel: Channel): Promise<void> {
		try {
			const ticket = await TicketHandler._ticket.getTicketByChannelId(
				channel.id,
			);
			if (!ticket) return;
			const panel = await TicketHandler._panel.getPanel(
				ticket.get('panelId') as string,
			);
			if (!panel) return;
			await TicketHandler._ticket.closeTicket(ticket);
			await (channel as TextChannel).permissionOverwrites.set([
				{
					id: (channel as TextChannel).guild.roles.everyone,
					deny: [
						PermissionFlagsBits.ViewChannel,
						PermissionFlagsBits.SendMessages,
					],
				},
			]);
			const roles = (panel.get('rolesId') as string).split(',');
			if (roles.length > 0 && roles[0] !== '') {
				for (const role of roles) {
					await (channel as TextChannel).permissionOverwrites.create(
						role,
						{
							ViewChannel: true,
							SendMessages: false,
						},
					);
				}
			}
		} catch (error) {
			console.error(error);
			throw new Error('Error while closing ticket');
		}
	}

	public async reopenTicket(channel: Channel): Promise<void> {
		const ticket = await TicketHandler._ticket.getTicketByChannelId(
			channel.id,
		);
		if (ticket) {
			await TicketHandler._ticket.reopenTicket(ticket);
			await (channel as TextChannel).permissionOverwrites.set([
				{
					id: (channel as TextChannel).guild.roles.everyone.id,
					deny: [PermissionFlagsBits.ViewChannel],
				},
				{
					id: ticket.get('creatorId') as string,
					allow: [
						PermissionFlagsBits.ViewChannel,
						PermissionFlagsBits.SendMessages,
					],
				},
			]);
			if (
				ticket.get('owner') &&
				(ticket.get('owner') as string).length > 0
			) {
				await (channel as TextChannel).permissionOverwrites.create(
					ticket.get('owner') as string,
					{
						ViewChannel: true,
						SendMessages: true,
					},
				);
			}
			if (
				ticket.get('users') &&
				(ticket.get('users') as string).length > 0
			) {
				for (const user of (ticket.get('users') as string).split(',')) {
					await (channel as TextChannel).permissionOverwrites.create(
						user,
						{
							ViewChannel: true,
							SendMessages: true,
						},
					);
				}
			}
		}
	}

	public async addUserToTicket(
		channel: Channel,
		users: User[],
	): Promise<Model<any, any>> {
		try {
			const ticket = await TicketHandler._ticket.getTicketByChannelId(
				channel.id,
			);
			if (ticket) {
				for (const user of users) {
					await (channel as TextChannel).permissionOverwrites.create(
						user.id,
						{
							ViewChannel: true,
							SendMessages: true,
						},
					);
				}
				await TicketHandler._ticket.addUsersToTicket(ticket, users);
				return ticket;
			}
		} catch (error) {
			console.error(error);
			for (const user of users) {
				await (channel as TextChannel).permissionOverwrites.delete(
					user.id,
				);
			}
			return Promise.reject(error);
		}
		return Promise.reject('Ticket not found');
	}

	public async removeUserFromTicket(
		channel: Channel,
		users: User[],
	): Promise<Model<any, any>> {
		try {
			const ticket = await TicketHandler._ticket.getTicketByChannelId(
				channel.id,
			);
			if (ticket) {
				for (const user of users) {
					await (channel as TextChannel).permissionOverwrites.delete(
						user.id,
					);
				}
				await TicketHandler._ticket.removeUsersFromTicket(
					ticket,
					users,
				);
				return ticket;
			}
		} catch (error) {
			console.error(error);
			return Promise.reject(error);
		}
		return Promise.reject('Ticket not found');
	}

	public async updateTicketOwner(
		channel: Channel,
		guild: Guild,
		newOwnerId: string,
	): Promise<Model<any, any> | null> {
		let ticket: Model<any, any> | null = null;
		try {
			const guildChannel = await guild.channels.fetch(channel.id);
			if (guildChannel && guildChannel.type === ChannelType.GuildText) {
				ticket = await TicketHandler._ticket.getTicketByChannelId(
					channel.id,
				);
				if (!ticket) {
					return Promise.reject('Ticket not found');
				}
				await guildChannel.permissionOverwrites.set([
					{
						id: guild.roles.everyone,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: ticket.get('creatorId') as string,
						allow: [
							PermissionFlagsBits.ViewChannel,
							PermissionFlagsBits.SendMessages,
						],
					},
					{
						id: newOwnerId,
						allow: [
							PermissionFlagsBits.ViewChannel,
							PermissionFlagsBits.SendMessages,
						],
					},
				]);
				ticket = await TicketHandler._ticket.updateTicketOwner(
					ticket,
					newOwnerId,
				);
				guildChannel.setName(
					`claim-${
						(await guild.members.fetch(newOwnerId)).displayName
					}`,
				);
			}
		} catch (error) {
			console.error(error);
			return Promise.reject(error);
		}
		return ticket;
	}

	public async updateTicketName(
		channel: Channel,
		guild: Guild,
		name: string,
	): Promise<Model<any, any> | null> {
		let ticket: Model<any, any> | null = null;
		try {
			const guildChannel = await guild.channels.fetch(channel.id);
			if (guildChannel && guildChannel.type === ChannelType.GuildText) {
				ticket = await TicketHandler._ticket.getTicketByChannelId(
					channel.id,
				);
				if (!ticket) {
					return Promise.reject('Ticket not found');
				}
				await guildChannel.setName(name);
			}
		} catch (error) {
			console.error(error);
			return Promise.reject(error);
		}
		return ticket;
	}

	public async deleteTicket(id: string): Promise<void> {
		const ticket = await TicketHandler._ticket.getTicketById(id);
		if (ticket) {
			await TicketHandler._ticket.deleteTicket(ticket);
		}
	}

	public async deleteTicketByChannel(channel: Channel): Promise<void> {
		const ticket = await TicketHandler._ticket.getTicketByChannelId(
			channel.id,
		);
		if (ticket) {
			await TicketHandler._ticket.deleteTicket(ticket);
		}
		await channel.delete();
	}

	// ============================== PANEL ============================== //

	public async createPanel(guildId: string): Promise<Model<any, any> | null> {
		return TicketHandler._panel.createPanel(guildId);
	}

	public async createIfLastPanelActive(
		guildId: string,
		model: Model<any, any> | null,
	): Promise<Model<any, any>> {
		if (!model || model.get('status') !== 2) {
			return await TicketHandler._panel.createPanel(guildId);
		}
		return model;
	}

	public async getPanelsByGuildId(
		guildId: string,
	): Promise<Model<any, any>[]> {
		return TicketHandler._panel.getPanelsByGuildId(guildId);
	}

	public async getPanelByGuildAndChannelId(
		guildId: string,
		channelId: string,
	): Promise<Model<any, any> | null> {
		return TicketHandler._panel.getPanelByGuildAndChannelId(
			guildId,
			channelId,
		);
	}

	public async getLatestPanel(
		guildId: string,
	): Promise<Model<any, any> | null> {
		return TicketHandler._panel.getLatestPanel(guildId);
	}

	public async updatePanel(
		id: string,
		data: Record<string, any>,
	): Promise<Model<any, any> | null> {
		return TicketHandler._panel.updatePanel(id, data);
	}

	public async deletePanel(id: string): Promise<Model<any, any>> {
		return TicketHandler._panel.deletePanel(id);
	}

	private async getChannelMessage(channel: TextChannel, after?: string) {
		let messages = await channel.messages.fetch({
			cache: true,
			after,
		});
		if (messages.size === 100) {
			const nextMessages = await this.getChannelMessage(
				channel,
				messages.last()?.id,
			);
			messages = messages.concat(nextMessages);
		}
		return messages;
	}

	public async transcriptTicket(
		channel: TextChannel,
		guild: Guild,
		user: User,
	): Promise<Model<any, any> | null> {
		let ticket: Model<any, any> | null = null;
		try {
			const guildChannel = await guild.channels.fetch(channel.id);
			if (guildChannel && guildChannel.type === ChannelType.GuildText) {
				ticket = await TicketHandler._ticket.getTicketByChannelId(
					channel.id,
				);
				if (!ticket) {
					return Promise.reject('Ticket not found');
				}
				const messages = await this.getChannelMessage(channel);
				const transcript = await buildTranscript(messages);
				const bufferResolvable = Buffer.from(transcript);
				const attachment = new AttachmentBuilder(bufferResolvable, {
					name: 'transcript.html',
				});
				user.send({
					files: [attachment],
				});
				const panel = await TicketHandler._panel.getPanel(
					ticket.get('panelId') as string,
				);
				const channelId = panel!.get('transcriptChannelId') as string;
				if (channelId) {
					const transcriptChannel =
						await guild.channels.fetch(channelId);
					if (
						transcriptChannel &&
						transcriptChannel.type === ChannelType.GuildText
					) {
						transcriptChannel.send({
							files: [attachment],
						});
					}
				}
			}
		} catch (error) {
			console.error(error);
			return Promise.reject(error);
		}
		return ticket;
	}
}

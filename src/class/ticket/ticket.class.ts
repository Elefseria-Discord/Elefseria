import { TicketModel } from '@src/structures/database/models';
import { User } from 'discord.js';
import { Model, ModelStatic } from 'sequelize';

export class Ticket {
	private static _instance: Ticket;
	private static _ticket: ModelStatic<Model<any, any>> = TicketModel;

	private constructor() {}

	public static getInstance(): Ticket {
		if (Ticket._instance) {
			return Ticket._instance;
		}
		Ticket._instance = new Ticket();
		return Ticket._instance;
	}

	public async createTicket(
		panelId: string,
		creatorId: string,
		guildId: string,
		channelId: string,
	) {
		const ticket = await Ticket._ticket.create({
			panelId,
			creatorId: creatorId,
			users: null,
			guildId,
			channelId,
			status: 1,
		});
		return ticket;
	}

	public async getTicketById(id: string): Promise<Model<any, any> | null> {
		return await Ticket._ticket.findOne({ where: { id } });
	}

	public async getTicketByChannelId(
		channelId: string,
	): Promise<Model<any, any> | null> {
		return await Ticket._ticket.findOne({ where: { channelId } });
	}

	public async getTicketsByGuildId(
		guildId: string,
	): Promise<Model<any, any>[]> {
		return await Ticket._ticket.findAll({ where: { guildId } });
	}

	public async getTicketsByUserId(
		userId: string,
	): Promise<Model<any, any>[]> {
		return await Ticket._ticket.findAll({ where: { owner: userId } });
	}

	public async reopenTicket(
		ticket: Model<any, any>,
	): Promise<Model<any, any>> {
		ticket.set('status', 1);
		await ticket.save();
		return ticket;
	}

	public async addUsersToTicket(
		ticket: Model<any, any>,
		users: User[],
	): Promise<Model<any, any>> {
		ticket.set(
			'users',
			((ticket.get('users') as string) || '')
				.split(',')
				.concat(users.map((u) => u.id))
				.join(','),
		);
		await ticket.save();
		return ticket;
	}

	public async removeUsersFromTicket(
		ticket: Model<any, any>,
		users: User[],
	): Promise<Model<any, any>> {
		ticket.set(
			'users',
			(ticket.get('users') as string)
				.split(',')
				.filter((u) => !users.map((u) => u.id).includes(u))
				.join(','),
		);
		await ticket.save();
		return ticket;
	}

	public async setUsersToTicket(
		ticket: Model<any, any>,
		users: User[],
	): Promise<Model<any, any>> {
		ticket.set('users', users.map((u) => u.id).join(','));
		await ticket.save();
		return ticket;
	}

	public async updateTicketOwner(
		ticket: Model<any, any>,
		ownerId: string,
	): Promise<Model<any, any> | null> {
		ticket.set('owner', ownerId);
		await ticket.save();
		return ticket;
	}

	public async closeTicket(
		ticket: Model<any, any>,
	): Promise<Model<any, any> | null> {
		ticket.set('status', 0);
		await ticket.save();
		return ticket;
	}

	public async deleteTicket(ticket: Model<any, any>): Promise<void> {
		await ticket.destroy();
	}

	public async getTicketNbByGuildId(guildId: string): Promise<number> {
		return await Ticket._ticket.count({ where: { guildId } });
	}
}

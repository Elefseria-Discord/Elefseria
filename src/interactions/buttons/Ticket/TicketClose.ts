import { DiscordClient } from '@src/structures';
import { BaseButtonInteraction } from '@src/structures/base/BaseButtonInteraction.class';
import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';

/**
 * @description TicketClose button interaction
 * @class TicketCloseButtonInteraction
 * @extends BaseButtonInteraction
 */
export class TicketCloseButtonInteraction extends BaseButtonInteraction {
    constructor() {
        super('ticketclose', 'Close a ticket', 'Ticket', 0);
    }

    /**
     * @description Executes the interaction
     * @param {DiscordClient} client
     * @param {ButtonInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        _client: DiscordClient,
        _interaction: ButtonInteraction,
    ): Promise<void> {}
}

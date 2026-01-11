import { BaseInteraction } from '@src/structures';
import {
	APIApplicationCommandOptionChoice,
	ApplicationCommandOptionType,
	InteractionContextType,
	LocalizationMap,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	SlashCommandBuilder,
} from 'discord.js';
export { DiscordClient } from '@class/Client.class';

export enum SlashCommandOptionType {
	USER = ApplicationCommandOptionType.User,
	CHANNEL = ApplicationCommandOptionType.Channel,
	ROLE = ApplicationCommandOptionType.Role,
	STRING = ApplicationCommandOptionType.String,
	INTEGER = ApplicationCommandOptionType.Integer,
}
export interface SlashCommandOptions {
	name: string;
	description: string;
	required?: boolean;
	choices?: APIApplicationCommandOptionChoice<string | number>[];
	type: SlashCommandOptionType;
}

/**
 * @description Base class for slash commands
 * @category BaseClass
 */
export class BaseSlashCommand extends BaseInteraction {
	private slashCommand: SlashCommandBuilder | undefined;

	constructor(
		name: string,
		description: string,
		moduleName: string,
		options: SlashCommandOptions[] = [],
		isEnabled: boolean = false,
		permissions: bigint[] = [BigInt(1)],
		contexts: InteractionContextType[] = [InteractionContextType.Guild],
		nsfw: boolean = false,
	) {
		super(name, description, moduleName, isEnabled, permissions);
		this.slashCommand = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description)
			.setContexts(contexts)
			.setDefaultMemberPermissions(
				permissions?.reduce((a, b) => a | b, BigInt(0)) || BigInt(1),
			)
			.setNSFW(nsfw);
		for (const option of options) {
			if (!option.choices) {
				if (option.type == SlashCommandOptionType.STRING)
					this.slashCommand.addStringOption((opt) =>
						opt
							.setName(option.name)
							.setDescription(option.description)
							.setRequired(option.required || false),
					);
				else if (option.type == SlashCommandOptionType.USER)
					this.slashCommand.addUserOption((opt) =>
						opt
							.setName(option.name)
							.setDescription(option.description)
							.setRequired(option.required || false),
					);
				else if (option.type == SlashCommandOptionType.CHANNEL)
					this.slashCommand.addChannelOption((opt) =>
						opt
							.setName(option.name)
							.setDescription(option.description)
							.setRequired(option.required || false),
					);
				else if (option.type == SlashCommandOptionType.INTEGER)
					this.slashCommand.addIntegerOption((opt) =>
						opt
							.setName(option.name)
							.setDescription(option.description)
							.setRequired(option.required || false),
					);
				else if (option.type == SlashCommandOptionType.ROLE)
					this.slashCommand.addRoleOption((opt) =>
						opt
							.setName(option.name)
							.setDescription(option.description)
							.setRequired(option.required || false),
					);
			} else {
				if (option.type == SlashCommandOptionType.STRING) {
					for (const choice of option.choices)
						if (typeof choice.value != 'string')
							throw new Error(
								'Choices must be of type string or number!',
							);
					this.slashCommand.addStringOption((opt) =>
						opt
							.setName(option.name)
							.setDescription(option.description)
							.setRequired(option.required || false)
							.setChoices(
								...(option.choices as APIApplicationCommandOptionChoice<string>[]),
							),
					);
				} else if (option.type == SlashCommandOptionType.USER)
					throw new Error('User options cannot have choices!');
				else if (option.type == SlashCommandOptionType.CHANNEL)
					throw new Error('Channel options cannot have choices!');
				else if (option.type == SlashCommandOptionType.INTEGER) {
					for (const choice of option.choices)
						if (typeof choice.value != 'number')
							throw new Error(
								'Choices must be of type string or number!',
							);
					this.slashCommand.addNumberOption((opt) =>
						opt
							.setName(option.name)
							.setDescription(option.description)
							.setRequired(option.required || false)
							.setChoices(
								...(option.choices as APIApplicationCommandOptionChoice<number>[]),
							),
					);
				} else if (option.type == SlashCommandOptionType.ROLE)
					throw new Error('Role options cannot have choices!');
			}
		}
	}

	public addNameLocalization(
		nameLocalizations: Partial<Record<keyof LocalizationMap, string>>,
	) {
		this.slashCommand?.setNameLocalizations(nameLocalizations);
	}

	public addDescriptionLocalization(
		descriptionLocalizations: Partial<
			Record<keyof LocalizationMap, string>
		>,
	) {
		this.slashCommand?.setDescriptionLocalizations(
			descriptionLocalizations,
		);
	}

	public set slashCommandInfo(slashCommand: SlashCommandBuilder) {
		this.slashCommand = slashCommand;
	}

	/**
	 * @description Returns the SlashCommandBuilder of the command
	 * @returns {SlashCommandBuilder}
	 *
	 */
	public getSlashCommandJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
		if (!this.slashCommand) {
			throw new Error(
				`Slash command ${this.name} does not have a SlashCommandBuilder`,
			);
		}
		return this.slashCommand.toJSON();
	}
}

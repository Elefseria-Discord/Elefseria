require('dotenv').config(); // LOAD CONFIG (.env)
import eventLoader from '@events/loader';
import { BaseModule, BaseSlashCommand } from '@src/structures';
import { Client, REST, Routes } from 'discord.js';

/**
 * @description Base class for client
 * @category BaseClass
 */

interface DiscordClientInfo {
	prefix: string;
	authorId?: string;
	modules: Map<string, BaseModule>;
}

export class DiscordClient extends Client {
	private prefix: string;
	private modules: Map<string, BaseModule> = new Map();
	private clientId: string;
	private baseRest: REST;
	private authorId?: string;

	constructor(
		config: any,
		prefix: string,
		clientId: string,
		rest: REST,
		authorId?: string,
	) {
		super(config);
		this.prefix = prefix;
		this.clientId = clientId;
		this.baseRest = rest;
		this.rest = rest;
		this.authorId = authorId;
	}

	/**
	 * @description Returns the modules of the client
	 * @returns {Map<string, BaseModule>}
	 * @example
	 * // returns the modules of the client
	 * client.getModules();
	 */
	public getModules(): Map<string, BaseModule> {
		return this.modules;
	}

	/**
	 * @description Returns the author id
	 * @returns {string}
	 * @example
	 * // returns the author id
	 * client.getAuthorId();
	 * @throws {Error} If the author id is not set
	 */
	public getAuthorId(): string {
		if (!this.authorId) throw new Error('The author id is not set');
		return this.authorId;
	}

	/**
	 * @description Returns the client id
	 * @returns {string}
	 */
	public getClientId(): string {
		return this.clientId;
	}

	/**
	 * @description Returns the prefix of the client
	 * @returns {string}
	 */
	public getBaseRest(): REST {
		return this.baseRest;
	}

	/**
	 * @description Add a module to the client
	 * @param {BaseModule} module
	 * @example
	 * // add a module to the client
	 * client.addModule(module);
	 * @returns {void}
	 * @throws {Error} If the module already exists
	 * @throws {Error} If the module is not an instance of BaseModule
	 */
	public addModule(module: BaseModule): void {
		if (this.modules.has(module.name))
			throw new Error(`The module ${module.name} already exists`);
		if (!(module instanceof BaseModule))
			throw new Error(
				`The module ${module} is not an instance of BaseModule`,
			);
		this.modules.set(module.name, module);
	}

	/**
	 * @description Add multiple modules to the client
	 * @param {BaseModule[]} modules
	 * @example
	 * // add multiple modules to the client
	 * client.addModules([module1, module2]);
	 * @returns {void}
	 * @throws {Error} If the module already exists
	 * @throws {Error} If the module is not an instance of BaseModule
	 * @throws {Error} If the modules is not an array
	 * @throws {Error} If the modules is empty
	 */
	public addModules(modules: BaseModule[]): void {
		if (!Array.isArray(modules))
			throw new Error(`The modules ${modules} is not an array`);
		if (modules.length == 0)
			throw new Error(`The modules ${modules} is empty`);
		modules.forEach((module: BaseModule) => {
			this.addModule(module);
		});
	}

	private async removeObsoleteCommands(
		client: DiscordClient,
		addedSlashCommands: Array<any>,
		localCommands: Map<string, string>, // Map associant les noms de commandes locales à leurs modules
		guildId?: string,
	): Promise<void> {
		const commandsToUnregister = addedSlashCommands.filter(
			(addedCommand) => !localCommands.has(addedCommand.name),
		);

		console.info(
			`Started unregistering ${commandsToUnregister.length} obsolete commands.`,
		);

		for (const command of commandsToUnregister) {
			try {
				await this.baseRest.delete(
					guildId
						? Routes.applicationGuildCommand(
								client.getClientId(),
								guildId,
								command.id,
							)
						: Routes.applicationCommand(
								client.getClientId(),
								command.id,
							),
				);
				console.info(`Unregistered obsolete command: ${command.name}`);
			} catch (error) {
				console.error(
					`Failed to unregister command: ${command.name}`,
					error,
				);
			}
		}

		console.info(
			`Successfully unregistered ${commandsToUnregister.length} obsolete commands.`,
		);
	}

	/**
	 * @description Load the modules of the client
	 * @returns {Promise<void>}
	 * @example
	 * // load the modules of the client
	 * client.loadModules();
	 */
	async loadModules(): Promise<void> {
		const restResponse = (await this.baseRest.get(
			process.env.DISCORD_BOT_GUILD_ID
				? Routes.applicationGuildCommands(
						this.clientId,
						process.env.DISCORD_BOT_GUILD_ID as string,
					)
				: Routes.applicationCommands(this.clientId),
		)) as Array<any>;
		const commandToModuleMap = new Map<string, string>();
		const addedSlashCommands: any[] = restResponse;

		for (const module of this.modules.values()) {
			await module.loadCommands(`src/commands/${module.name}`);
			await module.loadButtonInteractions(
				`src/interactions/buttons/${module.name}`,
			);
			await module.loadModalInteractions(
				`src/interactions/modals/${module.name}`,
			);
			await module.loadSelectChannelMenuInteractions(
				`src/interactions/selectMenu/channel/${module.name}`,
			);
			await module.loadSelectRoleMenuInteractions(
				`src/interactions/selectMenu/role/${module.name}`,
			);
			await module.loadSelectStringMenuInteractions(
				`src/interactions/selectMenu/string/${module.name}`,
			);
			await module.loadSlashCommands(
				`src/interactions/slash/${module.name}`,
			);
			for (const command of (
				module.getSlashCommands() as Map<string, BaseSlashCommand>
			).values()) {
				const commandData = command.getSlashCommandJSON();
				commandToModuleMap.set(commandData.name, module.name);
			}
		}

		const moduleCommandsMap = new Map<string, Array<any>>();

		for (const command of addedSlashCommands) {
			const moduleName = commandToModuleMap.get(command.name);
			if (!moduleName) continue; // Commande non reconnue dans les modules locaux

			if (!moduleCommandsMap.has(moduleName)) {
				moduleCommandsMap.set(moduleName, []);
			}
			moduleCommandsMap.get(moduleName)?.push(command);
		}

		await this.removeObsoleteCommands(
			this,
			addedSlashCommands,
			commandToModuleMap,
			process.env.DISCORD_BOT_GUILD_ID,
		);

		for (const module of this.modules.values()) {
			const moduleName = module.name;

			// Commandes déjà enregistrées pour ce module
			const alreadyAdded = moduleCommandsMap.get(moduleName) || [];

			// Enregistrement ou mise à jour des commandes pour ce module uniquement
			await module.registerSlashCommands(
				this,
				alreadyAdded,
				process.env.DISCORD_BOT_GUILD_ID,
			);
		}
	}

	/**
	 * @description Load the events of the client
	 * @returns {Promise<void>}
	 * @example
	 * // load the events of the client
	 * client.loadEvents();
	 */
	async loadEvents(): Promise<void> {
		await eventLoader(this);
	}

	/**
	 * @description Run the client
	 * @param {string} token
	 * @returns {Promise<void>}
	 * @example
	 * // run the client
	 * client.run('token');
	 */
	async run(token: string): Promise<void> {
		await this.login(token);
		console.info(`Bot started`);
	}

	/**
	 * @description Returns the prefix of the client
	 * @returns {string}
	 */
	public getPrefix(): string {
		return this.prefix;
	}

	/**
	 * @description Returns information about the client
	 * @returns {DiscordClientInfo}
	 */

	public getInfo(): DiscordClientInfo {
		return {
			prefix: this.prefix,
			modules: this.modules,
			authorId: this.authorId,
		};
	}
}

const BaseEvent = require('../../utils/structures/BaseEvent');
const { Client, Message } = require('discord.js');
const Exp = require("../../utils/database/models/exp");
const statistiques = require('../../utils/database/models/statistiques');
const ms = require("ms");

module.exports = class MessageEvent extends BaseEvent {
	constructor() {
		super('messageCreate');
	}

	/**
	 *
	 * @param {Client} client
	 * @param {Message} message
	 */
	async run(client, message) {
		if (message.author.bot) return;
		await levelingSystem(message);
		await increaseCount(message);
		if (message.content.startsWith(client.prefix)) {
			const [cmdName, ...cmdArgs] = message.content.slice(client.prefix.length).trim().split(/\s+/);
			for (var mod of client.modules) {
				if (!mod.isAModuleCommand(cmdName))
					continue;
				let isThisModuleEnabled = await mod.isThisModuleEnabled(message.guild.id);
				if (!isThisModuleEnabled) {
					message.channel.send(`Le module \`${mod.name}\` n'est pas activé !`);
					return;
				}
				mod.runCommand(cmdName, client, message, cmdArgs);
				return;
			}
		}
	}
}

/**
 * 
 * @param {Message} message 
 */
async function levelingSystem(message) {
	let userExp = await Exp.findOne({
		userId: message.author.id,
		guildId: message.guild.id
	});
	if (!userExp) {
		userExp = await Exp.create({
			userId: message.author.id,
			guildId: message.guild.id,
			exp: 0,
			level: 0,
			lastDateMessage: new Date()
		})
	} else {
		if (new Date() - userExp.get("lastDateMessage") < ms("1m")) {
			return;
		}
	}
	userExp.set("lastDateMessage", new Date());
	var min = Math.ceil(15),
		max = Math.floor(30);
	userExp.set("exp", userExp.get("exp") + Math.round(Math.random() * (max - min + 1)) + min);
	const curLevel = Math.floor(0.1 * Math.sqrt(userExp.get("exp")));
	if (userExp.get("level") < curLevel) {
		userExp.set("level", userExp.get("level") + 1);
		message.reply(`You've leveled up. You're now level **${curLevel}**!`);
	}
	userExp.save();
}

/**
 * 
 * @param {Message} message 
 */
async function increaseCount(message) {
	let userStat = await statistiques.findOne({
		guildId: message.guild.id,
		userId: message.author.id
	});
	if (!userStat) {
		userStat = await statistiques.create({
			guildId: message.guild.id,
			userId: message.author.id,
			invitesCount: 0,
			invitedUser: [],
			numberOfMsgs: 0
		});
	}
	userStat.set("numberOfMsgs", userStat.get("numberOfMsgs") + 1);
	userStat.save();
}
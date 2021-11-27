const { Client, Message } = require('discord.js');
const blacklist = require('../../utils/database/models/blacklist');
const PermissionGuard = require('../../utils/PermissionGuard');
const BaseCommand = require('../../utils/structures/BaseCommand');

module.exports = class VerifyCommand extends BaseCommand {
	constructor() {
		super('verify', 'security', [], 60, true, "Check every member on the guild", null, new PermissionGuard(["ADMINISTRATOR"]));
	}

	/**
	 * 
	 * @param {Client} client 
	 * @param {Message} message 
	 * @param {Array} args 
	 */

	async run(client, message, args) {
		var guild = message.guild
		let people = new Array()
		let members = await guild.members.fetch()
		members.filter(member => !member.user.bot).forEach(member => {
			let findBan = blacklist.findOne({userId: member.id})
			if (findBan) people.push(member.user.username)
			console.log("Avant", people)
		});
		console.log("Apres", people)
		if (people.length === 0) return message.channel.send(`No one on this server is blacklist in the bbd. You're safe.`)
		message.channel.send(`${people} are all the member who are in the bdd, be careful with them!`)
	}
}
const Giveaway = require("./database/models/giveaway")
const schedule = require("node-schedule")
const moment = require("moment")
const ms = require("ms");
const { Client, Message, TextChannel } = require("discord.js");
let jobMap = new Map()

async function saveGiveaway(response) {
    const {
        prize, winners, duration, guildId, messageId, channelId, endsOn, HostId
    } = response;

    const giveaway = new Giveaway({
        guildId,
        messageId,
        channelId,
        HostId,
        prize,
        winners,
        createdOn: new Date(),
        endsOn,
        duration
    });
    return giveaway.save();
}

/**
 * @param {Client} client
 * @param {Array} giveaways
 */

async function scheduleGiveaways(client, giveaways) {
    for (let i = 0; i < giveaways.length; i++) {
        const {channelId, messageId, endsOn, HostId, winners} = giveaways[i];
        jobMap.set(messageId, schedule.scheduleJob(new Date(endsOn), async() => {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                const message = await channel.messages.fetch(messageId);
                if (message) {
                    const {embeds, reactions} = message;
                    const reaction = reactions.cache.get('🎉');
                    const users = await reaction.users.fetch();
                    const entries = users.filter(user => !user.bot);
                    if (embeds.length === 1) {
                        let give = await Giveaway.findOne({ messageId: messageId })
                        const embed = embeds[0];
                        let winner = determineWinners(entries, winners);
                        if (winner.length === 0) {
                            embed.setDescription(`**NO WINNERS**\nHosted by: ${message.guild.members.cache.get(HostId)}`)
                            embed.setFooter(`Ended at • ${moment.parseZone(moment.now()).format("dddd Do MMMM in YYYY, HH:mm:ss")}`)
                        } else {
                            winner = winner.map(user => user.toString());
                            embed.setDescription(`**WINNERS(S):\n${winner.join('\n')}**\nHosted by: ${message.guild.members.cache.get(HostId)}`)
                            embed.setFooter(`Ended at • ${moment.parseZone(moment.now()).format("dddd Do MMMM in YYYY, HH:mm:ss")}`)
                            channel.send(`**WINNER(S) ${winner.join(', ')}** ! You won the **${give.get("prize")}** !\nhttps://discordapp.com/channels/${give.get("guildId")}/${give.get("channelId")}/${give.get("messageId")}`)
                        }
                        await message.edit({content:'🎉 **GIVEAWAY ENDED** 🎉', embeds:[embed]});
                        jobMap.delete(messageId)
                    }
                }
            }
        }))
    }
}

/**
 * 
 * @param {String} messageId 
 * @param {Message} msg 
 */
async function rerollGiveaways(messageId, msg) {
    let give = await Giveaway.findOne({ messageId: messageId })
    if (!give) return msg.channel.send("There is any giveaway with this messageId")
    const channel = msg.guild.channels.cache.get(give.get("channelId"))
    if (channel) {
        const message = await channel.messages.fetch(give.get("messageId"));
        if (message) {
            const {embeds, reactions} = message;
            const reaction = reactions.cache.get('🎉');
            const users = await reaction.users.fetch();
            const entries = users.filter(user => !user.bot);
            if (embeds.length === 1) {
                let give = await Giveaway.findOne({ messageId: messageId })
                const embed = embeds[0];
                let winner = determineWinners(entries, give.get("winners"));
                winner = winner.map(user => user.toString());
                if (winner.length !== 0)
                    channel.send(`**WINNER(S) ${winner.join(', ')}** ! You won the **${give.get("prize")}** !\nhttps://discordapp.com/channels/${give.get("guildId")}/${give.get("channelId")}/${give.get("messageId")}`)
            }
        }
    }
}

async function editGiveaways(messageId, response, msg, client) {
    if (!response) return;
    const {
        duration, endsOn, prize, winners
    } = response;
    const giveaway = await Giveaway.findOne({ messageId: messageId });
    if (!giveaway) return msg.channel.send("There is any giveaway with this messageId");
    let ends = new Date(Date.parse(giveaway.get("createdOn")) + ms(duration))
    if (endsOn)
        giveaway.set("endsOn", ends);
    if (duration)
        giveaway.set("duration", duration);
    if (prize)
        giveaway.set("prize", prize);
    if (winners)
        giveaway.set("winners", winners);
    const message = await client.channels.cache.get(giveaway.get("channelId")).messages.fetch(messageId);
    const { embeds } = message;
    embeds[0].setTitle(prize);
    embeds[0].setDescription(
        `React with 🎉 to enter!
        Winners: ${winners}
        Hosted by: ${message.guild.members.cache.get(giveaway.get("HostId"))}`
    );
    embeds[0].setFooter(`Ends at • ${moment.parseZone(ends).format("dddd Do MMMM in YYYY, HH:mm:ss")}`)
    message.edit({content:"🎉 **GIVEAWAY ** 🎉", embeds: embeds});
    jobMap.get(messageId).reschedule(ends);
    return giveaway;
}

function determineWinners(users, max) {
    if (users.size === 0) return [];
    const numbers = new Set();
    const winnersArray = [];
    let i = 0;
    while (i < max || i < users.size) {
        const random = Math.floor(Math.random() * users.size);
        const selected = users.at(random);
        if (!numbers.has(random)) {
            winnersArray.push(selected.username);
            i++;
        }
    }
    return winnersArray;
}

module.exports = {
    saveGiveaway, scheduleGiveaways, editGiveaways, rerollGiveaways
}
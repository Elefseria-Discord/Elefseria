import { Collection, Message } from 'discord.js';
import fs from 'fs';

async function loadStyles() {
	const css = fs.readFileSync('./src/structures/css/transcript.css', 'utf8');
	return css;
}

function messageContentCodeBlock(code: string) {
	let formatted = code;
	formatted = formatted.replace(/</g, '&lt;');
	formatted = formatted.replace(/>/g, '&gt;');
	formatted = formatted.replace(/"/g, '&quot;');
	formatted = formatted.replace(/'/g, '&#039;');
	formatted = formatted.replace(/`/g, '&#96;');
	formatted = formatted.replace(/,/g, '&#44;');
	formatted = formatted.replace(/:/g, '&#58;');
	formatted = formatted.replace(/=/g, '&#61;');
	formatted = formatted.replace(/@/g, '&#64;');
	formatted = formatted.replace(/\$/g, '&#36;');
	formatted = formatted.replace(/%/g, '&#37;');
	formatted = formatted.replace(/\^/g, '&#94;');
	formatted = formatted.replace(/\*/g, '&#42;');
	formatted = formatted.replace(/\(/g, '&#40;');
	formatted = formatted.replace(/\)/g, '&#41;');

	let newArea = formatted.split('\n');
	newArea.pop();
	newArea.shift();

	formatted = newArea.join('\n');
	formatted = formatted.replaceAll('\n', '<br>');
	return `${formatted}`;
}

function messageHtmlCreator(message: Message) {
	const isValidUrl = (urlString: string) => {
		try {
			return Boolean(new URL(urlString));
		} catch (e) {
			return false;
		}
	};

	let toAdd = '';
	if (message.attachments.size > 0) {
		const keys = message.attachments.keys();
		if (message.content)
			toAdd += `<div class='chatInput'>${message.content}</div></div><div class='chatContent'>`;
		for (let i = 0; i < message.attachments.size; i++) {
			if (i > 0)
				toAdd += `</div><li style='padding-top: 5px;'></li><div class='chatContent'>`;
			if (keys.next().value === undefined) continue;
			const attachment = message.attachments.get(keys.next().value!);
			if (!attachment) continue;
			if (attachment.height) {
				toAdd += `<img class='chatImage' src='${attachment.proxyURL}'>`;
			} else {
				toAdd += `<div class='chatInput'><a href='${attachment.url}'>${attachment.name}</a></div>`;
			}
		}
	} else {
		if (message.content) {
			if (isValidUrl(message.content))
				if (
					message.content.includes('tenor.com') ||
					message.content.includes('giphy.com')
				)
					toAdd += `<img class='chatGif' src='${
						message.content + '.gif'
					}'>`;
				else
					toAdd += `<div class='chatInput'><a href='${message.content}'>${message.content}</a></div>`;
			else if (message.content.startsWith('```'))
				toAdd += `<div class="code">${messageContentCodeBlock(
					message.content,
				)}</div>`;
			else toAdd += `<div class='chatInput'>${message.content}</div>`;
		}
	}
	return toAdd;
}

export default async function buildTranscript(
	messages: Collection<string, Message<true>>,
) {
	let transcript = '<body>';
	transcript += '<head><style>' + (await loadStyles()) + '</style></head>';

	transcript += "<div class='chatBox'>";

	let lastUser = 'none';
	let lastTime = '-1:-1';
	let lastDate = '-1/-1/-1';
	messages.forEach(async (message) => {
		const date = new Date(message.createdTimestamp);
		const dateFormatted = date.toLocaleDateString();
		const timeFormatted = date.getHours() + ':' + date.getMinutes();
		const GMT = date.getTimezoneOffset() / 60;

		if (message.author.bot) return;
		if (lastUser != message.author.id && lastUser != 'none')
			transcript += `<li style='padding-top: 20px;'></li>`;
		transcript += `<li class='chatListItem'><div class='chatContent'>`;
		if (
			lastUser != message.author.id ||
			lastTime.split(':')[1] != timeFormatted.split(':')[1] ||
			lastDate != dateFormatted
		) {
			transcript +=
				`<div class='userContent'>` +
				`<div class='chatUsername username'>${message.author.username}</div>` +
				`<div class='chatUsername userId'>${
					message.author.tag + ' ' + message.author.id
				}</div>` +
				`<div class='chatTimeStamp'>Today at ${
					timeFormatted + ` UTC + ${GMT}`
				}</div>` +
				`<img class='chatAvatar' src='${message.author.displayAvatarURL(
					{ forceStatic: true },
				)}' alt=${message.author.username}>` +
				`</div></div>` +
				`<div class='chatContent'>` +
				messageHtmlCreator(message);
		} else {
			transcript += messageHtmlCreator(message);
		}
		transcript += `</div></li>`;
		lastUser = message.author.id;
		lastTime = timeFormatted;
		lastDate = dateFormatted;

		transcript += '</div></body>';
	});

	return transcript;
}

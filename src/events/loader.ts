import { DiscordClient } from '@src/structures';
import { readdirSync } from 'fs';

/**
 * @description Loads the events of the client&
 * @param {Client} client
 * @returns {Promise<void>}
 * @async
 * @function
 * @name loadEvents
 * @memberof module:Events
 * @inner
 */
export = async (client: DiscordClient): Promise<void> => {
    const eventFiles = readdirSync('./src/events');
    for (const file of eventFiles) {
        const lstat = await (
            await import(`fs`)
        ).promises.lstat(`./src/events/${file}`);
        if (lstat.isDirectory()) {
            const subEventFiles = readdirSync(`./src/events/${file}`).filter(
                (file: string) => file.endsWith('event.ts'),
            );
            for (const subFile of subEventFiles) {
                const Event = await import(`../events/${file}/${subFile}`);
                Object.entries(Event).forEach(([key, value]) => {
                    try {
                        const event = new (value as any)();
                        if (event.once) {
                            client.once(event.name, (...args: any) =>
                                event.execute(client, ...args),
                            );
                        } else {
                            client.on(event.name, (...args: any) =>
                                event.execute(client, ...args),
                            );
                        }
                    } catch (error) {
                        console.error(
                            'Could not load event ' + file + '/' + subFile + '',
                        );
                    }
                });
            }
        }
    }
};
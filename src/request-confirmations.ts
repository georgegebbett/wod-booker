import { loadConfig } from './config';
import { initDb, setConfirmation } from './db';
import { sendMessage, createThread } from './discord-bot';

async function main() {
    const config = await loadConfig('classes.toml');
    await initDb();

    const channelId = config.discord_channel_id;

    // Get classes for 8-14 days ahead
    const dates: Date[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 0);  // Start 8 days ahead
    
    for (let i = 0; i < 7; i++) {  // Get 7 days worth
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    // Build confirmation messages for each user
    for (const user of config.users) {
        // Create a thread for this user's confirmations
        const thread = await createThread(
            channelId,
            `🗓️ ${user.name}'s Classes - week of ${startDate.toLocaleDateString('en-GB')}`,
            config.discord_bot_token
        );

        // Send intro message with clearer timing
        await sendMessage(
            thread.id,
            `<@${user.discord_id}> Please confirm your classes for next week:\n\n` +
            `⏰ Classes shown are for ${startDate.toLocaleDateString('en-GB')} to ${dates[6].toLocaleDateString('en-GB')}\n` +
            `✅ React to confirm each class you want to attend\n` +
            `⚠️ No-shows will be charged a fee!\n` +
            `🔔 Please confirm within 24 hours - classes will be booked 7 days before each session`,
            config.discord_bot_token
        );
        
        // Send individual messages for each class
        for (const date of dates) {
            const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
            const classes = user.classes.filter(c => c.days.includes(dayName));
            
            for (const cls of classes) {
                const confirmation = {
                    user: user.name,
                    date: date.toISOString().split('T')[0],
                    class_name: cls.name,
                    class_time: cls.time
                };

                const message = await sendMessage(
                    thread.id,
                    `${cls.name} on ${dayName}, ${date.toLocaleDateString('en-GB', { 
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric'
                    })} at ${cls.time}`,
                    config.discord_bot_token
                );

                await setConfirmation({
                    ...confirmation,
                    confirmed: false,
                    thread_id: thread.id,
                    message_id: message.id
                });
            }
        }
    }
}

main().catch(console.error); 
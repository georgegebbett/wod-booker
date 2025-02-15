import { loadConfig } from '../src/config';
import { initDb, setConfirmation, getConfirmation, ClassConfirmation } from '../src/db';
import { PendingConfirmation } from '../src/discord-bot';
import { sendMessage, checkMessageReactions } from '../src/discord-bot';



async function main() {
    const config = await loadConfig('classes.toml');
    await initDb();

    // Use channel ID directly from config
    const channelId = config.discord_channel_id;

    console.log('🚀 Starting confirmation flow test...');

    // Create a test confirmation
    const testConfirmation: ClassConfirmation = {
        user: 'Test User',
        date: new Date().toISOString().split('T')[0],
        class_name: 'Test Class',
        class_time: '07:00',
        confirmed: false,
        booked: false
    };

    // Initialize as unconfirmed
    await setConfirmation({
        ...testConfirmation,
        confirmed: false
    });

    // Send test message
    console.log('📨 Sending test message...');
    const message = await sendMessage(
        channelId,
        '🧪 **Test Confirmation Flow**\n\n' +
        'Please react with ✅ to test the confirmation system.\n' +
        'This message will be checked every 5 seconds until confirmed.',
        config.discord_bot_token
    );

    console.log('📝 Message sent! ID:', message.id);
    console.log('⏳ Waiting for reaction...');

    testConfirmation.message_id = message.id;

    // Poll for reaction
    let confirmed = false;
    const startTime = Date.now();
    const timeout = 60000; // 1 minute timeout

    while (!confirmed && Date.now() - startTime < timeout) {
        confirmed = await checkMessageReactions(channelId, message.id, config.discord_bot_token);
        if (confirmed) {
            await setConfirmation({
                ...testConfirmation,
                confirmed: true
            });
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        process.stdout.write('.');
    }

    // Final check
    const finalStatus = await getConfirmation(
        testConfirmation.user,
        testConfirmation.date,
        testConfirmation.class_time
    );

    if (finalStatus) {
        console.log('\n✅ Test successful! Confirmation was recorded.');
    } else {
        console.log('\n❌ Test failed or timed out. No confirmation recorded.');
    }
}

main().catch(console.error); 
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../src/config';
import { sendDiscordNotification } from '../src/notifications';

async function main() {
    const config = await loadConfig('classes.toml');
    
    try {
        console.log('Sending test notifications...');

        // Test success message
        await sendDiscordNotification(
            config.discord_webhook,
            '🧪 Test Success Message\n' +
            '✅ This is what a successful booking looks like!'
        );

        // Test error message
        await sendDiscordNotification(
            config.discord_webhook,
            '🧪 Test Error Message\n' +
            '❌ This is what an error message looks like!'
        );

        // Test class not found message
        await sendDiscordNotification(
            config.discord_webhook,
            '🧪 Test Info Message\n' +
            '⏳ This is what a "no class found" message looks like!'
        );

        console.log('✅ All test notifications sent!');
    } catch (error) {
        console.error('❌ Failed to send test notifications:', error);
    }
}

main(); 
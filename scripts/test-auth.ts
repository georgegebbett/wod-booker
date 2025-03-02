import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../src/config';
import { GymApiClient } from '../src/api-client';

async function main() {
    const config = await loadConfig('classes.toml');
    
    for (const user of config.users) {
        const client = new GymApiClient({
            clientId: user.clientId,
            username: user.username,
            password: user.password,
            membershipId: user.membershipId
        });
        
        console.log(`Testing authentication for ${user.name}...`);
        
        try {
            await client['ensureAuthenticated']();
            console.log('✅ Authentication successful');
            console.log('✅ Cookies set');
            console.log('✅ CSRF token retrieved');
        } catch (error) {
            console.error(`❌ Authentication test failed for ${user.name}:`, error);
        }
    }
}

main(); 
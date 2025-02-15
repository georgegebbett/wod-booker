import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../src/config';
import { GymApiClient } from '../src/api-client';
import { ClassScheduler } from '../src/scheduler';

async function main() {
    const config = await loadConfig('classes.toml');
    
    for (const user of config.users) {
        const client = new GymApiClient({
            clientId: user.clientId,
            username: user.username,
            password: user.password,
            apiBaseUrl: 'https://www.wodboard.com'
        });
        
        const scheduler = new ClassScheduler(user.classes);
        
        console.log(`\nChecking classes for ${user.name}...`);
        
        try {
            // Get classes for the next week
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);
            
            console.log(`Fetching classes from ${startDate.toDateString()} to ${endDate.toDateString()}`);
            
            const classes = await client.getClasses(startDate, endDate);
            const targetClasses = classes.filter(c => scheduler.isTargetClass(c, startDate));
            
            if (targetClasses.length === 0) {
                console.log('\nNo matching classes found in schedule');
                return;
            }
            
            console.log('\nMatching classes from your schedule:');
            targetClasses.forEach(c => {
                const date = new Date(c.start);
                console.log(`
🏋️ ${c.title} (${c.space})
   📅 ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
   👥 ${c.booking_count}/${c.size_limit} (${c.waitlist_count} waitlisted)
   ${c.is_bookable ? '✅ Open for booking' : c.booking_open ? '⏳ Not yet bookable' : '❌ Booking closed'}
   ${c.attending ? '🎯 You are attending' : c.waitlisted ? '⌛ You are waitlisted' : ''}
   🆔 ${c.id}
                `);
            });
            
            console.log(`Found ${targetClasses.length} matching classes`);
            
        } catch (error) {
            console.error(`❌ Class list test failed for ${user.name}:`, error);
        }
    }
}

main(); 
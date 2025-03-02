import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config';

import { GymApiClient } from './api-client';
import { ClassScheduler } from './scheduler';
import { getAllConfirmations, getConfirmation, getConfirmationDetails, setConfirmation } from './db';
import { sendMessage } from './discord-bot';
import { checkMessageReactions } from './discord-bot';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
    const config = await loadConfig('classes.toml');
    const now = new Date();
    
    for (const user of config.users) {
        console.log(`\nChecking classes for ${user.name}...`);
        
        try {
            // First update all confirmation statuses from Discord
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + 14);
            
            // Get all confirmations for the next 7 days
            const confirmations = await getAllConfirmations(user.name, now, endDate);
            let needToCheckWodboard = false;
            
            // Update confirmation statuses
            for (const confirmation of confirmations) {
                console.log(`Checking ${confirmation.class_name} on ${confirmation.date} - db state ${!!confirmation.confirmed ? 'confirmed' : 'not confirmed'}`);
                if (confirmation.thread_id && confirmation.message_id) {
                    // Check if class is within 7 days
                    console.log(`Thread ID and Message ID found`);
                    const classDate = new Date(confirmation.date);
                    const sevenDaysFromNow = new Date(now);
                    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

                    // Skip checking reactions and Wodboard if class is too far out
                    if (classDate > sevenDaysFromNow) {
                        console.log(
                            `Skipping ${confirmation.class_name} on ${classDate.toLocaleString('en-GB')} - ` +
                            `more than 7 days away (${Math.ceil((classDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days)`
                        );
                        continue;
                    }

                    const isCurrentlyConfirmed = await checkMessageReactions(
                        confirmation.thread_id,
                        confirmation.message_id,
                        config.discord_bot_token
                    );
                    
                    console.log(`${confirmation.class_name} on ${confirmation.date} is currently ${isCurrentlyConfirmed ? 'confirmed' : 'not confirmed'} - db state ${!!(confirmation.confirmed) ? 'confirmed' : 'not confirmed'}`);

                    if (isCurrentlyConfirmed !== !!(confirmation.confirmed)) {
                        console.log(`Updating confirmation status for ${confirmation.class_name} on ${confirmation.date} to ${isCurrentlyConfirmed}`);
                        await setConfirmation({
                            ...confirmation,
                            confirmed: isCurrentlyConfirmed
                        });
                        
                        // If something was just confirmed, we need to check Wodboard
                        if (isCurrentlyConfirmed) {
                            needToCheckWodboard = true;
                        }
                    } else {
                        console.log(`${confirmation.class_name} on ${confirmation.date} is already in the correct state`);
                    }
                    
                    // If anything is confirmed and not booked, we need to check Wodboard
                    if (confirmation.confirmed && !confirmation.booked) {
                        console.log(`${confirmation.class_name} on ${confirmation.date} is confirmed and not booked, need to check Wodboard`);
                        needToCheckWodboard = true;
                    } else {
                        console.log(`${confirmation.class_name} on ${confirmation.date} is confirmed and booked, no need to check Wodboard`);
                    }
                } else {
                    console.log(`${confirmation.class_name} on ${confirmation.date} has no thread ID or message ID, skipping`);
                }
            }
            
            // Only hit Wodboard API if we have confirmed and not booked classes
            if (needToCheckWodboard) {
                const client = new GymApiClient({
                    clientId: user.clientId!,
                    username: user.username,
                    password: user.password,
                    apiBaseUrl: 'https://www.wodboard.com',
                    membershipId: user.membership_id
                });
                
                const scheduler = new ClassScheduler(user.classes);
                const classes = await client.getClasses(now, endDate);
                
                // Filter for classes we might want to book
                const targetClasses = classes.filter(c => 
                    scheduler.isTargetClass(c, new Date(c.start))
                );
                
                // Then attempt to book confirmed classes
                for (const cls of targetClasses) {
                    const date = new Date(cls.start);
                    const wasConfirmed = await getConfirmation(
                        user.name,
                        date.toISOString().split('T')[0],
                        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                    );
                    
                    // If confirmed and bookable and not already booked, book it
                    if (wasConfirmed && cls.is_bookable && !cls.attending && !cls.waitlisted) {
                        await client.bookClass(cls.id);
                        const confirmation = await getConfirmationDetails(
                            user.name,
                            date.toISOString().split('T')[0],
                            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        );
                        
                        if (confirmation) {
                            // Mark as booked
                            await setConfirmation({
                                ...confirmation,
                                booked: true
                            });

                            // Send notification
                            if (confirmation.thread_id) {
                                await sendMessage(
                                    confirmation.thread_id,
                                    `✅ Booked ${cls.title} for ${date.toLocaleString('en-GB', {hour: '2-digit', minute: '2-digit', weekday: 'long', month: 'numeric', day: 'numeric'})}`,
                                    config.discord_bot_token,
                                );
                            } else {
                                await sendMessage(
                                    config.discord_channel_id,
                                    `✅ Booked ${cls.title} for ${user.name} on ${date.toLocaleString('en-GB', {hour: '2-digit', minute: '2-digit', weekday: 'long', month: 'numeric', day: 'numeric'})}`,
                                    config.discord_bot_token,
                                );
                            }
                        }
                    }
                    // Log status for monitoring
                    else {
                        console.log(
                            `Class ${cls.title} on ${date.toLocaleString('en-GB')} is` +
                            `${wasConfirmed ? ' confirmed' : ' not confirmed'}` +
                            `${cls.is_bookable ? ' and bookable' : ' but not bookable'}` +
                            `${cls.attending ? ' (already attending)' : ''}` +
                            `${cls.waitlisted ? ' (on waitlist)' : ''}`
                        );

                        // If we find it's already booked (attending or waitlisted), update the DB
                        if (wasConfirmed && (cls.attending || cls.waitlisted)) {
                            const confirmation = await getConfirmationDetails(
                                user.name,
                                date.toISOString().split('T')[0],
                                date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                            );
                            
                            if (confirmation && !confirmation.booked) {
                                console.log(`Marking ${cls.title} as booked - found ${cls.attending ? 'attending' : 'waitlisted'}`);
                                await setConfirmation({
                                    ...confirmation,
                                    booked: true
                                });
                            }
                        }
                    }
                }
                
                if (targetClasses.length === 0) {
                    console.log(`No matching classes found in the next 7 days`);
                }
            } else {
                console.log('No confirmed classes to check');
            }
        } catch (error) {
            await sendMessage(
                config.discord_channel_id,
                `🚨 Error checking/booking classes for ${user.name}: ${error}`,
                config.discord_bot_token
            );
            console.error('Error:', error);
        }
    }
}

// Run the script
main(); 
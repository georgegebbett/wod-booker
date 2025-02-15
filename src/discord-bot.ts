import { setConfirmation } from './db';

export interface PendingConfirmation {
    user: string;
    date: string;
    class_name: string;
    class_time: string;
}

export async function sendMessage(channelId: string, content: string, botToken: string) {
    const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        }
    );

    if (!response.ok) {
        console.error('Failed to send message:', await response.text());
        throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json() as Promise<{ id: string }>;
}

export async function createThread(channelId: string, name: string, botToken: string) {
    const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/threads`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                type: 11, 
                auto_archive_duration: 10080 // 7 days (in minutes)
            }),
        }
    );

    if (!response.ok) {
        console.error('Failed to create thread:', await response.text());
        throw new Error(`Failed to create thread: ${response.statusText}`);
    }

    return response.json() as Promise<{ id: string }>;
}

export async function checkMessageReactions(channelId: string, messageId: string, botToken: string) {
    const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/✅`,
        {
            headers: {
                'Authorization': `Bot ${botToken}`
            }
        }
    );

    if (!response.ok) {
        console.error('Failed to check reactions:', await response.text());
        return false;
    }

    const reactions = await response.json() as Array<{ bot?: boolean }>;
    const isConfirmed = reactions.some(user => !user.bot);

    return isConfirmed;
} 
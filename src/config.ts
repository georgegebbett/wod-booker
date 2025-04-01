import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { parse } from 'smol-toml';
import type { Config } from './types';
import { z } from 'zod';
const __dirname = dirname(fileURLToPath(import.meta.url));

const WODBOARD_CLIENT_ID = 'I25T3i9ROmru49o3QWtLMNsiIsVKtd1zc6YgNJKA3Qg';

const dayOfWeekSchema = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

const configFileSchema = z.object({
    discord_channel_id: z.string(),
    discord_bot_token: z.string(),
    users: z.array(z.object({
        name: z.string(),
        username: z.string(),
        password: z.string(),
        discord_id: z.string(),
        membership_id: z.string().optional(),
        classes: z.array(z.object({
            name: z.string(),
            time: z.string(),
            days: z.array(dayOfWeekSchema)
        })),
        timezone: z.string()
    }))
});

export async function loadConfig(configPath: string): Promise<Config> {
    const fullPath = join(__dirname, '..', configPath);
    const configFile = await readFile(fullPath, 'utf-8');
    const parsedConfig = parse(configFile);


    const userConfig = configFileSchema.parse(parsedConfig);

    return {
        discord_channel_id: userConfig.discord_channel_id,
        discord_bot_token: userConfig.discord_bot_token,
        users: userConfig.users.map(user => ({
            ...user,
            membershipId: user.membership_id,
            clientId: WODBOARD_CLIENT_ID
        }))
    };
}

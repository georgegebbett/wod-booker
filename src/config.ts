import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { parse } from 'smol-toml';
import type { Config } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WODBOARD_CLIENT_ID = 'I25T3i9ROmru49o3QWtLMNsiIsVKtd1zc6YgNJKA3Qg';

export interface ApiConfig {
    clientId: string;
    username: string;
    password: string;
    apiBaseUrl: string;
    membershipId?: string;
}

export async function loadConfig(configPath: string): Promise<Config> {
    const fullPath = join(__dirname, '..', configPath);
    const configFile = await readFile(fullPath, 'utf-8');
    const userConfig = parse(configFile) as unknown as Config;

    return {
        discord_channel_id: userConfig.discord_channel_id,
        discord_bot_token: userConfig.discord_bot_token,
        users: userConfig.users.map(user => ({
            ...user,
            clientId: WODBOARD_CLIENT_ID
        }))
    };
}

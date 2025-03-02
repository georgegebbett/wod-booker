import { CookieJar } from 'tough-cookie';
import type { AuthResponse, WodBoardEvent, UserConfig } from './types';

export class GymApiClient {
    private config: Pick<UserConfig, 'clientId' | 'username' | 'password' | 'membershipId'>;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    private csrfToken: string | null = null;
    private cookieJar: CookieJar;
    private readonly apiBaseUrl = 'https://www.wodboard.com';

    constructor(config: Pick<UserConfig, 'clientId' | 'username' | 'password' | 'membershipId'>) {
        this.config = config;
        this.cookieJar = new CookieJar();
    }

    private async fetch(url: string, options: RequestInit & { 
        headers?: Record<string, string>,
        processHeaders?: boolean 
    } = { processHeaders: true }) {
        const cookies = await this.cookieJar.getCookieString(url);
        const headers = {
            ...options.headers,
            Cookie: cookies,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Only process Set-Cookie headers if requested
        if (options.processHeaders !== false) {
            const setCookieHeaders = response.headers.getSetCookie()
            for (const cookie of setCookieHeaders) {
                await this.cookieJar.setCookie(cookie, url);
            }
        }

        return response;
    }

    private async authenticate(): Promise<void> {
        const params = new URLSearchParams();
        params.append('client_id', this.config.clientId);
        params.append('grant_type', 'password');
        params.append('scope', 'mobile_client');
        params.append('username', this.config.username);
        params.append('password', this.config.password);

        const response = await this.fetch(`${this.apiBaseUrl}/oauth/token`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'WodBoard/64 CFNetwork/3826.400.120 Darwin/24.3.0',
                'Accept-Language': 'en-GB,en;q=0.9'
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Authentication failed: ${response.statusText}\n${text}`);
        }

        const data = await response.json() as AuthResponse;
        this.accessToken = data.access_token;
        this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    }

    private async setCookie(): Promise<void> {
        const response = await this.fetch(
            `${this.apiBaseUrl}/api/v1/mobile/auth/set_cookie?version=1.9.0.33`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                }
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to set cookie: ${response.statusText}\n${text}`);
        }
    }

    private async getCSRFToken(): Promise<void> {
        const response = await this.fetch(`${this.apiBaseUrl}/dashboard`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to get CSRF token: ${response.statusText}\n${text}`);
        }

        const text = await response.text();
        const match = text.match(/<meta name="csrf-token" content="([^"]+)"/);
        if (!match) {
            throw new Error('Could not find CSRF token in page');
        }

        this.csrfToken = match[1];
    }

    private async ensureAuthenticated(): Promise<void> {
        if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
            await this.authenticate();
            await this.setCookie();
            this.csrfToken = null;
        }
        if (!this.csrfToken) {
            await this.getCSRFToken();
        }
    }

    async getClasses(startDate: Date, endDate: Date): Promise<WodBoardEvent[]> {
        await this.ensureAuthenticated();
        
        const response = await this.fetch(
            `${this.apiBaseUrl}/calendars/72/events.json?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}&_=${Date.now()}`,
            {
                headers: {
                    'X-CSRF-Token': this.csrfToken!
                }
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to get classes: ${response.statusText}\n${text}`);
        }

        return response.json();
    }

    async bookClass(eventId: number): Promise<string> {
        console.log(`Booking class ${eventId}`);
        await this.ensureAuthenticated();

        const params = new URLSearchParams();
        params.append('_method', 'post');
        params.append('authenticity_token', this.csrfToken!);
        if (this.config.membershipId) {
            console.log(`Using membership ID ${this.config.membershipId}`);
            params.append('reserve_with', this.config.membershipId);
            params.append('payment_type', 'stripe_card');
        }

        const response = await this.fetch(
            `${this.apiBaseUrl}/events/${eventId}/bookings`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': this.apiBaseUrl,
                    'Referer': `${this.apiBaseUrl}/calendars/72`
                },
                body: params.toString(),
                redirect: 'manual',
                processHeaders: false // Skip processing response headers
            }
        );

        if (response.status === 302) {
            return "Booked";
        }

        throw new Error(`Failed to book class: ${response.statusText}`);
    }
} 
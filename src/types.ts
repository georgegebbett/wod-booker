export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export interface GymClass {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    instructor: string;
    capacity: number;
    bookedCount: number;
    isBookable: boolean;
}

export interface WodBoardEvent {
    id: number;
    start: string;
    end: string;
    title: string;
    typeColor: string;
    booking_count: number;
    waitlist_count: number;
    size_limit: number;
    url: string;
    instructors: string[] | null;
    space: string;
    has_happened: boolean;
    booking_open: boolean;
    booking_have_opened: boolean;
    attending: boolean;
    waitlisted: boolean;
    is_instructor: boolean;
    is_bookable: boolean;
    is_waitlistable: boolean;
    in_waitlist_queue: boolean;
    multipleDependentsView: any | null;
}

export interface CookieResponse {
    success: boolean;
    message?: string;
}

export type ClassConfig = {
    name: string;
    time: string;
    days: string[];
};

export interface CSRFResponse {
    csrf_token: string;
    csrf_param: string;
}

export interface UserConfig {
    name: string;
    username: string;
    password: string;
    clientId: string;
    discord_id: string;
    timezone: string;
    classes: ClassConfig[];
    membershipId?: string;
}

export interface Config {
    discord_channel_id: string;
    discord_bot_token: string;
    users: UserConfig[];
} 
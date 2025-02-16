import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export interface ClassConfirmation {
    user: string;
    date: string;
    class_name: string;
    class_time: string;
    confirmed: boolean;
    thread_id?: string;
    message_id?: string;
    booked?: boolean;
}

let db: any = null;

const dbPath = process.env.DB_PATH || 'bookings.db';

export async function initDb() {
    if (!db) {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS class_confirmations (
                user TEXT,
                date TEXT,
                class_name TEXT,
                class_time TEXT,
                confirmed BOOLEAN DEFAULT FALSE,
                thread_id TEXT,
                message_id TEXT,
                booked BOOLEAN DEFAULT FALSE,
                PRIMARY KEY (user, date, class_time)
            )
        `);
    }
    return db;
}

export async function getConfirmation(user: string, date: string, time: string): Promise<boolean> {
    const db = await initDb();
    const result = await db.get(
        'SELECT confirmed FROM class_confirmations WHERE user = ? AND date = ? AND class_time = ?',
        [user, date, time]
    );
    return !!result?.confirmed;
}

export async function setConfirmation(confirmation: ClassConfirmation) {
    const db = await initDb();
    await db.run(
        `INSERT OR REPLACE INTO class_confirmations 
         (user, date, class_name, class_time, confirmed, thread_id, message_id, booked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            confirmation.user, 
            confirmation.date, 
            confirmation.class_name, 
            confirmation.class_time, 
            confirmation.confirmed,
            confirmation.thread_id ?? null,
            confirmation.message_id ?? null,
            confirmation.booked ?? false
        ]
    );
}

export async function getConfirmationDetails(user: string, date: string, time: string): Promise<ClassConfirmation | null> {
    const db = await initDb();
    return db.get(
        'SELECT * FROM class_confirmations WHERE user = ? AND date = ? AND class_time = ?',
        [user, date, time]
    );
}

export async function getAllConfirmations(user: string, startDate: Date, endDate: Date): Promise<ClassConfirmation[]> {
    const db = await initDb();
    return db.all(
        'SELECT * FROM class_confirmations WHERE user = ? AND date BETWEEN ? AND ?',
        [
            user, 
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        ]
    );
} 
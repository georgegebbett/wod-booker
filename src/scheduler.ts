import { type ClassConfig, type WodBoardEvent, type UserConfig } from './types';

export class ClassScheduler {
    private config: ClassConfig[];
    private timezone: string;

    constructor(user: UserConfig) {
        this.config = user.classes;
        this.timezone = user.timezone;
    }

    isTargetClass(event: WodBoardEvent, date: Date): boolean {
        const eventDate = new Date(event.start);
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });

        
        return this.config.some(classConfig => {
            // Convert event time to the user's timezone
            
            

            const eventTime = eventDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
                timeZone: this.timezone
            });

            

            return event.title === classConfig.name &&
                   eventTime === classConfig.time &&
                   classConfig.days.includes(dayName);
            
           
        });
    }
} 
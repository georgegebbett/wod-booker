import { ClassConfig, WodBoardEvent } from './types';

export class ClassScheduler {
    private config: ClassConfig[];

    constructor(userClasses: ClassConfig[]) {
        this.config = userClasses;
    }

    isTargetClass(event: WodBoardEvent, date: Date): boolean {
        const eventDate = new Date(event.start);
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
        const eventTime = eventDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });

        return this.config.some(classConfig => 
            event.title === classConfig.name &&
            eventTime === classConfig.time &&
            classConfig.days.includes(dayName)
        );
    }
} 
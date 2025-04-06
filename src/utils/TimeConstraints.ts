import { TimeConstraints } from "./types"
import dotenv from 'dotenv'
dotenv.config();

export const timeConstraints: TimeConstraints = {
    // general is for cases like avoid wednesdays or maybe constant time frames where you know you are preoccupied and cant make the appointment.
    general: {
        disallowedDays: ['יום א', 'יום ב', 'יום ג', 'יום ד', 'יום ה', 'יום ו', 'יום ש'], // יום א, יום ב, .....
        disallowedDates: [],         // 'dd/mm/yyy'
        disallowedTimeFrame: []      // '16:00-17:00', '08:25-09:30', ....
    },
    // specific is for when you want to avoid setting an appointment on a specific date at a specific time frame.
    specific: [
        {
            disallowedDate: '',         // 'dd/mm/yyy'
            disallowedTimeFrame: ''      // '16:00-17:00', '08:25-09:30', ....
        },
        {
            disallowedDate: '',         // 'dd/mm/yyy'
            disallowedTimeFrame: ''      // '16:00-17:00', '08:25-09:30', ....
        },
    ],
    // no later than represents the latest date that satisfies the user for an appointment.
    noLaterThan: '20/5/2025',
    // is the user ok with setting an appointment for the same day that the check is being done
    isTodayAllowed: false
}
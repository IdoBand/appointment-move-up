import { TimeConstraints } from "./types"
import dotenv from 'dotenv'
dotenv.config()

export const DOCTOR_URL = process.env.DOCTOR_URL

export const inputsPersonalData: Record<string, string> = { 
    day: process.env.DOB_DAY,
    dobMonth:  process.env.DOB_MONTH,
    dobYear: process.env.DOB_YEAR,
    id: process.env.ID,
}

export const timeConstraints: TimeConstraints = {
    // general is for cases like avoid wednesdays or maybe constant time frames where you know you are preoccupied and cant make the appointment. Lists can be empty.
    general: {
        disallowedDays: ['יום א', 'יום ב', 'יום ג', 'יום ד', 'יום ה', 'יום ו', 'יום ש'], // יום א, יום ב, .....
        disallowedDates: [],                 // 'dd/mm/yyyy'           ---> '20/11/2025'
        disallowedDatesFrame: [],            // 'dd/mm/yyy-dd/mm/yyy'  ---> '20/11/2025-23/11/2025'
        disallowedHoursFrame: []             // 'hh:mm-hh:mm'          ---> '16:00-17:00'
    },
    // specific is for when you want to avoid setting an appointment on a specific date at a specific time frame. List can be empty.
    specific: [
        {
            disallowedDate: '',              // 'dd/mm/yyy'            ---> '20/11/2025'
            disallowedHoursFrame: ''         // 'hh:mm-hh:mm'          ---> '16:00-17:00'
        },
    ],
    // no later than represents the latest date that satisfies the user for an appointment. String can be empty.
    noLaterThan: '20/5/2025',
    // is the user ok with setting an appointment for the same day that the check is being done. Must be a boolean.
    isTodayAllowed: false
}
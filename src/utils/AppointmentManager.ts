import { timeConstraints } from "./TimeConstraints"
import { Appointment } from "./types"
import { format, isAfter } from 'date-fns'

export class AppointmentManager {

    isAppointmentSatisfiesConstraints(appointment: Appointment) {
        // general
        const generalConstraints = timeConstraints.general
        generalConstraints.disallowedDays.forEach(hebrewDay => {
            if (hebrewDay === appointment.hebrewDay) return false
        })
        generalConstraints.disallowedDates.forEach(date =>{
            if (date === appointment.date) return false
        })
        generalConstraints.disallowedTimeFrame.forEach(TimeFrame => {
            if (this.isHourInRange(TimeFrame, appointment.hour)) return false
        })

        // specific
        timeConstraints.specific.forEach((DateAndTimeFrame) => {
            const disallowedDate = DateAndTimeFrame.disallowedDate
            const disallowedTimeFrame = DateAndTimeFrame.disallowedTimeFrame
            if (disallowedDate === appointment.date && this.isHourInRange(disallowedTimeFrame, appointment.hour)) return false
        })

        // noLaterThan
        if (timeConstraints.noLaterThan && isAfter(appointment.date, timeConstraints.noLaterThan) ) {
            return false
        }
        // isTodayAllowed
        const todaysDate = format(new Date(), 'dd/MM/yyyy')
        if (appointment.date === todaysDate && !timeConstraints.isTodayAllowed) return false

        return true
    }
    selectAppointment(appointments: Appointment[]) {
        let selectedAppointment: Appointment
        // relying on the fact that appointments in the website are already sorted by date in ascending order
        for (const appointment of appointments) {
            if (this.isAppointmentSatisfiesConstraints(appointment)) {
                selectedAppointment = appointment
                break
            }
        }
        return selectedAppointment
    }
    
    isHourInRange(range: string, hour: string): boolean {
        const [start, end] = range.split('-').map(time => time.trim());

        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
    
        const startMinutes = toMinutes(start);
        const endMinutes = toMinutes(end);
        const hourMinutes = toMinutes(hour);
    
        return hourMinutes >= startMinutes && hourMinutes <= endMinutes;
    }
}
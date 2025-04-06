import { Appointment } from "./types"
import { format, isAfter, parse } from 'date-fns'
import { timeConstraints } from "./TimeConstraints"

export class AppointmentManager {

    isAppointmentSatisfiesConstraints(appointment: Appointment) {
        // general
        const generalConstraints = timeConstraints.general
        for (const hebrewDay of generalConstraints.disallowedDays) {
            if (hebrewDay === appointment.hebrewDay.trim()) { return false }
        }
        for (const date of generalConstraints.disallowedDates) {
            if (date === appointment.date.trim()) { return false }
        }
        for (const timeFrame of generalConstraints.disallowedTimeFrame) {
            if (this.isHourInRange(timeFrame, appointment.hour.trim())) { return false }
        }

        // specific
        for (const dateAndTimeFrame of timeConstraints.specific) {
            const disallowedDate = dateAndTimeFrame.disallowedDate
            const disallowedTimeFrame = dateAndTimeFrame.disallowedTimeFrame
            if (disallowedDate === appointment.date && this.isHourInRange(disallowedTimeFrame, appointment.hour)) { 
                return false
            }
        }

        // noLaterThan
        if (timeConstraints.noLaterThan) {
            const noLaterThanDate = parse(timeConstraints.noLaterThan, 'dd/MM/yyyy', new Date());
            const appointmentDate = parse(appointment.date, 'dd/MM/yyyy', new Date());

            if (isAfter(appointmentDate, noLaterThanDate) ) { return false }
        }
        
        // isTodayAllowed
        const todaysDate = format(new Date(), 'dd/MM/yyyy')
        if (appointment.date === todaysDate && !timeConstraints.isTodayAllowed) { return false }

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
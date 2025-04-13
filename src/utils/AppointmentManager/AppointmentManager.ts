import { Appointment, TimeConstraints } from "../types"
import { format, isAfter, isBefore, isSameDay, parse } from 'date-fns'

export class AppointmentManager {
    availableAppointments: Appointment[]
    timeConstraints: TimeConstraints

    isAppointmentSatisfiesConstraints(appointment: Appointment) {
        // general
        const generalConstraints = this.timeConstraints.general
        for (const hebrewDay of generalConstraints.disallowedDays) {
            if (hebrewDay === appointment.hebrewDay.trim()) { 
                return false }
        }
        for (const date of generalConstraints.disallowedDates) {
            if (date === appointment.date.trim()) { 
                return false }
        }
        for (const datesFrame of generalConstraints.disallowedDatesFrame) {  
            if (this.isDateInFrame(datesFrame, appointment.date)) { 
                return false }
        }
        for (const timeFrame of generalConstraints.disallowedHoursFrame) {
            if (this.isHourInFrame(timeFrame, appointment.hour.trim())) { 
                return false }
        }

        // specific
        for (const dateAndTimeFrame of this.timeConstraints.specific) {
            const disallowedDate = dateAndTimeFrame.disallowedDate
            const disallowedHoursFrame = dateAndTimeFrame.disallowedHoursFrame
            if (disallowedDate === appointment.date && this.isHourInFrame(disallowedHoursFrame, appointment.hour)) { 
                return false
            }
        }

        // noLaterThan
        if (this.timeConstraints.noLaterThan) {
            const noLaterThanDate = parse(this.timeConstraints.noLaterThan, 'dd/MM/yyyy', new Date());
            const appointmentDate = parse(appointment.date, 'dd/MM/yyyy', new Date());

            if (isAfter(appointmentDate, noLaterThanDate) ) { 
                return false }
        }
        
        // isTodayAllowed
        const todaysDate = format(new Date(), 'dd/MM/yyyy')
        if (appointment.date === todaysDate && !this.timeConstraints.isTodayAllowed) { 
            return false }

        return true
    }
    selectAppointment() {
        let selectedAppointment: Appointment
        const sortedAppointments = this.sortAppointmentsByDateAndHour(this.availableAppointments)

        for (const appointment of sortedAppointments) {
            if (this.isAppointmentSatisfiesConstraints(appointment)) {
                selectedAppointment = appointment
                break
            }
        }
        return selectedAppointment
    }
    parseAppointmentToDate(appointment: Appointment): Date {
        const dateTimeString = `${appointment.date} ${appointment.hour}`
        return parse(dateTimeString, 'dd/MM/yyyy HH:mm', new Date())
    }
    sortAppointmentsByDateAndHour(appointments: Appointment[]): Appointment[] {
        return appointments.sort((a, b) => {
            const dateA = this.parseAppointmentToDate(a)
            const dateB = this.parseAppointmentToDate(b)
            return dateA.getTime() - dateB.getTime()
        })
    }
    isHourInFrame(hoursFrame: string, hour: string): boolean {
        const [start, end] = hoursFrame.split('-').map(time => time.trim());

        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
    
        const startMinutes = toMinutes(start);
        const endMinutes = toMinutes(end);
        const hourMinutes = toMinutes(hour);
    
        return hourMinutes >= startMinutes && hourMinutes <= endMinutes;
    }
    isDateInFrame(datesFrame: string, date: string): boolean {
        let result = false
        const [frameStart, frameEnd] = datesFrame.split('-')

        const frameStartDate = parse(frameStart, 'dd/MM/yyyy', new Date())
        const frameEndDate = parse(frameEnd, 'dd/MM/yyyy', new Date())
        const dateDate = parse(date, 'dd/MM/yyyy', new Date())

        if (
            (isSameDay(dateDate, frameStartDate)) ||
            (isSameDay(dateDate, frameEndDate)) ||
            (isAfter(dateDate, frameStartDate) && isBefore(dateDate, frameEndDate))
        ) {
            result = true
        }
        return result
    }
    isTodayPassedNoLaterThanDate() {
        const noLaterThanDate = parse(this.timeConstraints.noLaterThan, 'dd/MM/yyyy', new Date());
        const today = new Date()

        return isAfter(today, noLaterThanDate)
    }
}
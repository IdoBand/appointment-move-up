export type Appointment = {
    date: string
    hebrewDay: string
    hour: string
    buttonId: string
}

export type TimeConstraints = {
    general: {
        disallowedDays: string[],
        disallowedDates: string[],
        disallowedDatesFrame: string []
        disallowedHoursFrame: string[]
    },
    specific: SpecificDateTime[],
    noLaterThan: string
    isTodayAllowed: boolean
}
type SpecificDateTime = {
    disallowedDate: string
    disallowedHoursFrame: string
}
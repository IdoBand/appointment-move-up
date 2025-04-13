import puppeteer from "puppeteer";
import { Human } from "./utils/Human";
import { Appointment } from "./utils/types";
import { inputsPersonalData, DOCTOR_URL } from "./utils/userData";

export async function scrapeScript(startingDate: Date): Promise<{ isAppointmentSet: boolean, eventLog: string }> {
    let human: Human
    try {
        // 1.
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // 2.
        await page.goto(DOCTOR_URL);
        
        human = new Human(browser, page, startingDate)
        await human.getTimeConstraints()
        await human.waitLong()
        // 3.
        const zimunTorBtn = await human.findDOMElement('a', 'זימון תור')
        await human.clickButton(zimunTorBtn)
        // 4.
        await human.handleSelectInput('select#DrpDay', inputsPersonalData.dobDay)

        await human.handleSelectInput('select#DrpMonth', inputsPersonalData.dobMonth)

        await human.handleSelectInput('select#DrpYear', inputsPersonalData.dobYear)

        await human.handleTextInput('#memberId', inputsPersonalData.id)
        // 5.
        const hamshechBtn = await human.findDOMElement('a', 'המשך')
        await human.clickButton(hamshechBtn)
        // 5.5
        const isVisitTypeNecessary = await human.findDOMElement('select.visitTypeSelect')
        if (isVisitTypeNecessary) {
            // 6.
            await human.handleSelectInput('select.visitTypeSelect', 'ביקור רגיל')
        }
        
        const hazegTorimBtn = await human.findDOMElement('a', 'הצגת תורים פנויים לסוג הביקור')
        if (hazegTorimBtn) {
            // 7.
            await human.clickButton(hazegTorimBtn)
        }
        
        // 8.
        const availableAppointments: Appointment[] = await human.scrapeAppointments()
        human.setAvailableAppointments(availableAppointments)
        // 9.
        const selectedAppointment = human.selectAppointment()
        // 10.
        const hazmenTorBtn = await human.findDOMElement(`a#${selectedAppointment.buttonId}`, 'הזמן תור')
        await human.clickButton(hazmenTorBtn)
        await human.waitLong()
        // 10.5.
        if (human.isSelectedAppointmentSet) {
            throw new Error('Appointment set! skip to finish.')
        }
        // 11.
        const yesBtn = await human.findDOMElement('a', 'כן')
        await human.clickButton(yesBtn)

        human.onAppointmentSet(`scrapeScript - 'yesBtn' was clicked`)
        await human.waitLong()

    } catch (err) {
        human.exit()
    } finally {
        return {
            isAppointmentSet: human.isSelectedAppointmentSet,
            eventLog: human.eventLog
        }
    }
}
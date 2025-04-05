import puppeteer from "puppeteer";
import { Human } from "./Human";
import dotenv from 'dotenv'
dotenv.config();


const inputsPersonalData: Record<string, {
        selector: string,
        value: string
    }> = {
        day: {
            selector: 'select#DrpDay',
            value: process.env.DOB_DAY
        },
        month: {
            selector: 'select#DrpMonth',
            value: process.env.DOB_MONTH
        },
        year: {
            selector: 'select#DrpYear',
            value: process.env.DOB_YEAR
        },
        id: {
            selector: '#memberId',
            value: process.env.ID
        },
    }

export async function scenario(): Promise<{ isAppointmentSet: boolean, eventLog: string }> {
    let human: Human
    try {
        // 1.
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        // 2.
        await page.goto(process.env.DOCTOR_ADDRESS);
        
        human = new Human(browser, page)
        await human.waitLong()
        // 3.
        const zimunTorBtn = await human.findDOMElement('a', 'זימון תור')
        await human.clickButton(zimunTorBtn)
        // 4.
        const day = inputsPersonalData.day
        await human.handleSelectInput(day.selector, day.value)

        const month = inputsPersonalData.month
        await human.handleSelectInput(month.selector, month.value)

        const year = inputsPersonalData.year
        await human.handleSelectInput(year.selector, year.value)

        const id = inputsPersonalData.id
        await human.handleTextInput(id.selector, id.value)
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
        await human.scrapeAppointments()
        // 9.
        const selectedAppointment = human.selectAppointment()
        // 10.
        const hazmenTorBtn = await human.findDOMElement(`a#${selectedAppointment.buttonId}`, 'הזמן תור')
        await human.clickButton(hazmenTorBtn)
        // 10.5. hidden step, see 'addAlertEventlistener' method and scenario.txt
        // 11.
        const yesBtn = await human.findDOMElement('a', 'כן')
        await human.clickButton(yesBtn)
        human.logAppointmentSet(`scenario() - 'yesBtn' was clicked`)
        await human.waitLong()
        human.exit()
        return { isAppointmentSet: true, eventLog: human.eventLog }
    } catch (err) {
        human.exit()
        return { isAppointmentSet: false, eventLog: human.eventLog }
    }
}
import puppeteer from "puppeteer";
import dotenv from 'dotenv'
dotenv.config();
import { Human } from "./Human";

const timeConstraints = {
    // general is for cases like avoid wednesdays or maybe constant time frames where you know you are preoccupied and cant make the appointment.
    general: {
        disallowedDays: ['יום ב'],
        disallowedDates: [],
        disallowedTimeSpan: []
    },
    // specific is for when you want to avoid setting an appointment on a specific date at a specific time frame.
    specific: {
        disallowedDate: '',
        disallowedTimeSpan: ''
    }
}

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

export async function scenario() {
    // 1.
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // 2.
    await page.goto(process.env.DOCTOR_ADDRESS);
    
    const human = new Human(browser, page)
    await human.waitLong()
    // 3.
    await human.findButtonAndClick('a', 'זימון תור')
    await human.waitLong()

    const day = inputsPersonalData.day
    await human.handleSelectInput(day.selector, day.value)
    await human.waitLong()
    const month = inputsPersonalData.month
    await human.handleSelectInput(month.selector, month.value)
    await human.waitLong()
    const year = inputsPersonalData.year
    await human.handleSelectInput(year.selector, year.value)
    await human.findButtonAndClick('a', 'המשך')
    await human.waitLong()
    const id = inputsPersonalData.id
    await human.handleTextInput(id.selector, id.value)
    await human.findButtonAndClick('a', 'המשך')
    // 4.
    await human.findButtonAndClick('a', 'הצגת תורים פנויים לסוג הביקור')
    await human.waitLong()
    // 5.
    await human.scrapeAppointments()
    // 6.
    console.log(human.availableAppointments)



    human.exit()
  
    // Close after a few seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.close();
}
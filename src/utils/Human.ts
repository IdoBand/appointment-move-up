import { Browser, Page, ElementHandle } from "puppeteer"
import { Appointment } from "src/utils/types"
import { AppointmentManager } from "./AppointmentManager/AppointmentManager"
import { format } from 'date-fns'

export class Human {
    isAppointmentSet: boolean = false
    currentPage: Page
    browser: Browser
    selectedAppointment:Appointment
    AM = new AppointmentManager()
    eventLog: string = ''
    
    constructor(browser: Browser, page: Page, startingDate: Date){
        this.browser = browser
        this.currentPage = page
        this.addAlertEventlistener()
        this.log('INFO', 'constructor', `First interval started at ${format(startingDate, 'dd/MM/yyyy HH:mm')}`)
    }
    
    /*
    * Pauses scrapeScript for a random time of 2s-5s
    **/
    async waitLong() {
        const timeout = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000)
        return await new Promise(resolve => setTimeout(resolve, timeout))
    }
    /*
    * Pauses scrapeScript for a random time of 1s-3s
    **/
    async waitShort() {
        const timeout = Math.floor(Math.random() * (3000 - 1000 + 1) + 1000)
        return await new Promise(resolve => setTimeout(resolve, timeout))
    }
    /**
     * Find a DOM element by a css selector and an optional innerText of that DOM element if exists.
     * @param selector css selector.
     * @param innerText Inner text inside a button or HTMLElement for example. Defaults to an empty string.
     * @returns 
     */
    async findDOMElement(selector: string, innerText: string = ""): Promise<ElementHandle<Element> | undefined> {
        let result: ElementHandle<Element> | undefined = undefined;
        const selectorDescription = `'${selector}' ${innerText && `, innerText: "${innerText}"`}`
        this.log('ACTION', 'Human.findDOMElement',`looking for ${selectorDescription}`)

        try {
            if (innerText) {
                await this.currentPage.waitForFunction(
                    (selector, text) => {
                        const elements = Array.from(document.querySelectorAll(selector));
                        return elements.some(el => el.textContent?.trim() === text);
                    },
                    { timeout: 5000 },
                    selector,
                    innerText
                );
    
                const elements = await this.currentPage.$$(selector);
    
                for (const el of elements) {
                    const text = await this.currentPage.evaluate(el => el.textContent?.trim(), el);
                    if (text === innerText) {
                        result = el;
                        break;
                    }
                }
            } else {
                await this.currentPage.waitForSelector(selector, { timeout: 5000 });
                result = await this.currentPage.$(selector);
            }
    
            const status = result ? 'SUCCESS' : 'WARNING';
            const message = result ? `${selectorDescription} was found` : `${selectorDescription} was not found`;
    
            this.log(status, 'Human.findDOMElement', message);
        } catch (err) {
            this.log('ERROR', 'Human.findDOMElement', `Failed to find ${selectorDescription}: ${(err as Error).message}`);
        } finally {
            return result;
        }
    }
    async clickButton(button: ElementHandle<Element> | undefined) {
        this.log('ACTION','Human.clickButton', `trying to click ${button}.`)
         try {
            await button.click()
            this.log('SUCCESS','Human.clickButton', `${button} was clicked.`)
            await this.waitLong()
        } catch (err) {
            this.logAndThrowError(`ERROR Human.clickButton - while trying to click ${button}.`, err)
            throw new Error('')
        }
    }

    async delay(min: number, max: number) {
        const timeout = Math.floor(Math.random() * (max - min + 1) + min)
        return new Promise(resolve => setTimeout(resolve, timeout))
    }

    async smoothScroll(page: Page, targetY: number) {
        let currentPosition = 0
        const step = 100 // Pixels per scroll
        while (currentPosition < targetY) {
            await page.evaluate((scrollStep) => {
                window.scrollBy(0, scrollStep)
            }, step)
            currentPosition += step
            await this.delay(300, 700) // Small random delay
        }
    }

    // Randomized mouse movements
    async moveMouse(page: Page) {
        const viewport = await page.viewport()
        if (!viewport) return

        const targetX = Math.floor(Math.random() * viewport.width)
        const targetY = Math.floor(Math.random() * viewport.height)
        
        await page.mouse.move(targetX, targetY, { steps: Math.floor(Math.random() * 20) + 10 })
        await this.delay(500, 1500)
    }

    // Randomized clicking to avoid bot detection
    async randomClick(page: Page, selector: string) {
        const element = await page.$(selector)
        if (element) {
            // Move mouse to element before clicking
            const box = await element.boundingBox()
            if (box) {
                const x = box.x + Math.random() * box.width
                const y = box.y + Math.random() * box.height

                await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 15) + 5 })
                await this.delay(300, 1000) // Human-like delay before clicking
                await page.mouse.down()
                await this.delay(50, 300)  // Vary click duration
                await page.mouse.up()
            }
        }
    }
    
    // Spoof user-agent and navigator properties
    async spoofBrowser(page: Page) {
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        )

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => false })
            Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] })
        })
    }

    async scrapeAppointments() {
        this.log('ACTION', 'Human.scrapeAppointments' ,`trying to scrape appointments.`)
        try {
            await this.currentPage.waitForSelector('tr.ItemStyle, tr.AlternatingItemStyle', { timeout: 5000 })
        
            const appointments = await this.currentPage.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('tr.ItemStyle, tr.AlternatingItemStyle'))
                const results: Appointment[] = []
            
                const datePattern = /^\d{2}\/\d{2}\/\d{4}$/
                const hebrewDayPattern = /יום[\u00a0 ]?[א-ש]/
                const hourPattern = /^\d{2}:\d{2}$/
            
                rows.forEach(row => {
                    const spans = Array.from(row.querySelectorAll('td > span'))
                    let date = ''
                    let hebrewDay = ''
                    let hour = ''
                    let buttonId = ''
            
                    spans.forEach(span => {
                    const text = (span.textContent || '').trim()
                    if (datePattern.test(text)) {
                        date = text
                    } else if (hebrewDayPattern.test(text)) {
                        hebrewDay = text.replace(/\u00a0/g, ' ')
                    } else if (hourPattern.test(text)) {
                        hour = text
                    }
                    })
            
                    const btn = Array.from(row.querySelectorAll('a')).find(a => a.textContent?.trim() === 'הזמן תור') as HTMLAnchorElement
                    if (btn) {
                        buttonId = btn.id
                    }
            
                    if (date && hebrewDay && hour && buttonId) {
                        results.push({ date, hebrewDay, hour, buttonId })
                    }
                })
            
                return results
            })
            this.log('SUCCESS', 'Human.scrapeAppointments', `appointments were scraped.`)
            return appointments
        } catch (err) {
            this.logAndThrowError(`ERROR - Human.scrapeAppointments`, err)
        }
    }
    setAvailableAppointments(availableAppointments: Appointment[]) {
        if (!availableAppointments) {
            this.logAndThrowError(`ERROR - Human.scrapeAppointments`, new Error('availableAppointments is undefined/null'))
            return
        }
        this.AM.availableAppointments = availableAppointments
    }
    selectAppointment(): Appointment {
        this.log ('ACTION', 'Human.selectAppointment', `trying to select an appointment`)
        if (this.AM.availableAppointments.length === 0) {
            // problematic point. its possible that a doctor may not have available appointments at all without it being an error.
            this.logAndThrowError(`AMBIGUOUS Human.selectAppointment - availableAppointments.length = 0`, new Error(''))
        }
        const selectedAppointment = this.AM.selectAppointment()
        if (selectedAppointment) {
            this.selectedAppointment = selectedAppointment
            this.log('YAY!','Human.selectAppointment',`found an appointment:\n${this.selectedAppointment}`)
        } else {
            this.logAndThrowError(`UNLUCKY Human.selectAppointment - No appointment that satisfies the time constraints was found .\nExiting iteration with no appointment set.`, new Error(''))
        }
        return selectedAppointment
    }
    async handleSelectInput(selector: string, optionLabelToSelect: string) {
        this.log('ACTION', 'Human.handleSelectInput', `trying to find '${selector}' and select '${optionLabelToSelect}'`)
        try {
          await this.currentPage.waitForSelector(selector)
          await this.currentPage.click(selector)
      
          await this.currentPage.evaluate((sel, label) => {
            const select = document.querySelector(sel) as HTMLSelectElement | null
            if (!select) return
      
            const option = Array.from(select.options).find(
              (o) => o.textContent?.trim() === label
            )
      
            if (option) {
              select.value = option.value
              select.dispatchEvent(new Event('change', { bubbles: true }))
            }
          }, selector, optionLabelToSelect)
          this.log('SUCCESS', 'Human.handleSelectInput', `'${optionLabelToSelect}' was selected`)

          await this.waitShort()
      
        } catch (err) {
            this.log('ERROR', 'Human.handleSelectInput', `'${optionLabelToSelect}' was not selected`)
        }
    }
    async handleTextInput(selector: string, textToInput: string) {
        this.log('ACTION', 'Human.handleTextInput', `trying to find '${selector}' and write '${textToInput}'`)
        try {
            await this.currentPage.waitForSelector(selector)
            const input: ElementHandle = await this.findDOMElement(selector, '')
        
            await input.click({ clickCount: 1 }) // Select existing text if any
            await input.press('Backspace') // clear input first
            await this.waitShort()
        
            for (const char of textToInput) {
              await input.type(char, { delay: 100 + Math.random() * 100 })
            }
            this.log('SUCCESS', 'Human.handleTextInput', `'${textToInput}' was written`)
          } catch (err) {
            this.logAndThrowError(`Human.handleTextInput - '${textToInput}' was not written`, err)
          }
    }
    exit() {
        this.browser.close()
    }
    logAndThrowError(message: string, error: Error) {
        this.eventLog += `${format(new Date(), 'dd/MM/yyyy HH:mm')} - ${message}\n${error.message ? `Error message:\n${error.message}` : ''}\n`
        throw new Error('')
    }
    log(status: string, senderMethod: string, message: string) {
        this.eventLog += `${format(new Date(), 'dd/MM/yyyy HH:mm')} - ${status} - ${senderMethod}() - ${message}\n`
    }
    async addAlertEventlistener() {
        this.currentPage.on('dialog', async dialog => {
            const alertMessage = dialog.message().trim()
            if (alertMessage === 'האם לזמן תור?') {
                await dialog.accept()
                this.logAppointmentSet(`Human.listenToAlerts - '${alertMessage}' alert was accepted.`)
                await this.waitLong()
                throw new Error('')
            } else {
                await dialog.dismiss()
                this.logAndThrowError(`ERROR - Human.listenToAlerts - 'Unexpected and unhandled alert: ${alertMessage}'`, new Error(''))
            }
        })
    }
    logAppointmentSet(source: string) {
        if (!this.selectedAppointment) {
            this.logAndThrowError('ERROR - Human.logAppointmentSet - Was invoked with no actual selectedAppointment.', new Error(''))
        }
        this.log('SUCCESS','Human.logAppointmentSet',`${source}\nAppointment details:\n
            date: ${this.selectedAppointment.date}\n
            day: ${this.selectedAppointment.hebrewDay}\n
            hour: ${this.selectedAppointment.hour}\n
            `)
    }
}

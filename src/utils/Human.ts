import { Browser, Page, ElementHandle } from "puppeteer"
import { Appointment, TimeConstraints } from "src/utils/types"
import { AppointmentManager } from "./AppointmentManager/AppointmentManager"
import { format } from 'date-fns'
import { getTimeConstraints } from "./mongoDB/mongoDB"

export class Human {
    currentPage: Page
    browser: Browser
    isSelectedAppointmentSet: boolean = false
    selectedAppointment: Appointment
    AM: AppointmentManager = new AppointmentManager()
    eventLog: string = ''
    timeConstraints: TimeConstraints
    timeout: number = 10000
    constructor(browser: Browser, page: Page, startingDate: Date) {
        this.browser = browser
        this.currentPage = page
        this.spoofBrowser()
        this.addAlertEventlistener()
        this.log('INFO', 'constructor', `First interval started at ${format(startingDate, 'dd/MM/yyyy HH:mm')}`)
    }
    
    /*
    * Pauses scrapeScript for a random time of 3s-7s
    **/
    async waitLong() {
        const timeout = Math.floor(Math.random() * (7000 - 3000 + 1) + 3000)
        return await new Promise(resolve => setTimeout(resolve, timeout))
    }
    /*
    * Pauses scrapeScript for a random time of 2s-5s
    **/
    async waitShort() {
        const timeout = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000)
        return await new Promise(resolve => setTimeout(resolve, timeout))
    }
    /**
     * Find a DOM element by a css selector and an optional innerText of that DOM element if exists.
     * 
     * Not finding an element will result in WARNING log message and not an error, because in some cases we are not sure in what page we are.
     * @param selector css selector.
     * @param innerText Inner text inside a button or HTMLElement for example. Defaults to an empty string.
     * @returns
     */
    async findDOMElement(selector: string, innerText: string = ""): Promise<ElementHandle<Element> | undefined> {
        const selectorDescription = `'${selector}' ${innerText && `, innerText: "${innerText}"`}`
        let result: ElementHandle<Element> | undefined = undefined;
        let resultLogStatus = "WARNING"
        let resultLogMessage = `${selectorDescription} was not found.`

        this.log('ACTION', 'Human.findDOMElement',`looking for ${selectorDescription}`)

        try {
            if (innerText) {
                await this.currentPage.waitForFunction(
                    (selector, text) => {
                        const elements = Array.from(document.querySelectorAll(selector))
                        return elements.some(el => el.textContent?.trim() === text)
                    },
                    { timeout: this.timeout },
                    selector,
                    innerText
                );
    
                const elements = await this.currentPage.$$(selector);
    
                for (const el of elements) {
                    const text = await this.currentPage.evaluate(el => el.textContent?.trim(), el)
                    if (text === innerText) {
                        result = el
                        break
                    }
                }
            } else {
                await this.currentPage.waitForSelector(selector, { timeout: this.timeout })
                result = await this.currentPage.$(selector)
            }
            if (result) {
                resultLogStatus = 'SUCCESS'
                resultLogMessage = `${selectorDescription} was found`
            }
        } catch (err) {
            resultLogMessage += `Error Message: ${err.message}`
        } finally {
            this.log(resultLogStatus, 'Human.findDOMElement', resultLogMessage)
            return result;
        }
    }
    async clickButton(button: ElementHandle<Element> | undefined) {
        this.log('ACTION','Human.clickButton', `trying to click ${button}.`)
        try {
            await button.click()
            this.log("SUCCESS",'Human.clickButton', `${button} was clicked.`)
        } catch (err) {
            const errMessage = `${button} could not be clicked\n${err.message}`
            this.log('ERROR', 'Human.clickButton', errMessage)
            throw new Error(errMessage)
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
    
    async spoofBrowser() {
        await this.currentPage.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        );
      
        await this.currentPage.evaluateOnNewDocument(() => {
          // Webdriver
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
          // Plugins
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
      
          // Languages
          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
          });
      
          // Hardware Concurrency
          Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 8,
          });
      
          // Touch support
          Object.defineProperty(navigator, 'maxTouchPoints', {
            get: () => 1,
          });
      
          // WebGL Vendor/Renderer
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function (parameter) {
            if (parameter === 37445) return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
            if (parameter === 37446) return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER_WEBGL
            return getParameter.call(this, parameter)
          };
      
          // Canvas Fingerprint Spoof
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function (...args) {
            const result = originalToDataURL.apply(this, args);
            return result.replace(/^data:image\/png;base64,/, 'data:image/png;base64,fakecanvas')
          };
      

        });
      }
      

    async scrapeAppointments() {
        this.log('ACTION', 'Human.scrapeAppointments' ,`trying to scrape appointments.`)
        this.waitLong()
        try {
            this.tryDetectUnauthorizedActivityMessage()
            await this.currentPage.waitForNetworkIdle({ timeout: 120000} )
            await this.currentPage.waitForSelector('tr.ItemStyle, tr.AlternatingItemStyle', { timeout: 120000 })
        
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
            this.log('ERROR', 'Human.scrapeAppointments', err.message)
            throw err
        }
    }
    setAvailableAppointments(availableAppointments: Appointment[]) {
        if (!availableAppointments) {
            const err = new Error('availableAppointments is undefined/null')
            this.log('ERROR', 'Human.setAvailableAppointments', err.message)
            throw err
        }
        this.AM.availableAppointments = availableAppointments
    }
    selectAppointment(): Appointment {
        this.log ('ACTION', 'Human.selectAppointment', `trying to select an appointment.`)
        if (this.AM.availableAppointments.length === 0) {
            // problematic point. its possible that a doctor may not have available appointments at all without it being an error.
            this.log('AMBIGUOUS', 'Human.selectAppointment', 'availableAppointments.length = 0')
        }
        const selectedAppointment = this.AM.selectAppointment()
        if (!selectedAppointment) {
            const err = new Error('No appointment that satisfies the time constraints was found. Exiting iteration with no appointment set.')
            this.log('UNLUCKY', 'Human.selectAppointment', err.message)
            throw err
        }

        this.selectedAppointment = selectedAppointment
        this.log('SUCCESS', 'Human.selectAppointment', 'an appointment was found')
        return selectedAppointment
    }
    async handleSelectInput(selector: string, optionLabelToSelect: string) {
        this.log('ACTION', 'Human.handleSelectInput', `trying to find '${selector}' and select '${optionLabelToSelect}'`)
        try {
            await this.currentPage.waitForSelector(selector, { visible: true, timeout: this.timeout })
            await this.currentPage.click(selector)
      
            await this.currentPage.evaluate((sel, label) => {
                const select = document.querySelector(sel) as HTMLSelectElement | null
                if (!select) {
                    throw new Error('Select input was not found. Check selector')
                }
        
                const option = Array.from(select.options).find((o) => o.textContent?.trim() === label)
                
                if (!option) {
                    throw new Error('Option was not found. Check option value')
                }

                select.value = option.value
                select.dispatchEvent(new Event('change', { bubbles: true }))
                
            }, selector, optionLabelToSelect)
            this.log('SUCCESS', 'Human.handleSelectInput', `'${optionLabelToSelect}' was selected`)

            await this.waitShort()
      
        } catch (err) {
            this.log('ERROR', 'Human.handleSelectInput', err)
            throw err
        }
    }
    async handleTextInput(selector: string, textToInput: string) {
        this.log('ACTION', 'Human.handleTextInput', `trying to find '${selector}' and write '${textToInput}'`)
        try {
            await this.currentPage.waitForSelector(selector, { timeout: this.timeout })
            const input: ElementHandle = await this.findDOMElement(selector, '')
        
            await input.click({ clickCount: 1 }) // Select existing text if any
            await input.press('Backspace')   // clear input first
            await this.waitShort()
        
            for (const char of textToInput) {
              await input.type(char, { delay: 100 + Math.random() * 100 })
            }
            this.log('SUCCESS', 'Human.handleTextInput', `'${textToInput}' was written`)
        } catch (err) {
            this.log('ERROR',`Human.handleTextInput`, err.message)
            throw err
        }
    }
    exit() {
        this.browser.close()
    }
    log(status: string, senderMethod: string, message: string) {
        this.eventLog += `${format(new Date(), 'dd/MM/yyyy HH:mm')} - ${status} - ${senderMethod} - ${message}\n`
    }
    async addAlertEventlistener() {
        this.currentPage.once('dialog', async (dialog) => {
            try {
                const alertMessage = dialog.message().trim()
                this.log('ACTION', 'Human.addAlertEventlistener', `Encountered an alert, Trying to handle. Alert message: '${alertMessage}'.`)
                if (alertMessage === 'האם לזמן תור?') {
                    await dialog.accept()
                    this.waitLong()
                    this.onAppointmentSet('Human.addAlertEventlistener')
                } else {
                    this.log('ERROR', 'Human.addAlertEventlistener', `Unexpected and unhandled alert: ${alertMessage}`)
                    await dialog.dismiss()
                }
            } catch {
                this.log('ERROR', 'Human.addAlertEventlistener', `Something unexpected happened.`)
            }
        })
    }
    onAppointmentSet(senderMethod: string) {
        if (!this.selectedAppointment) {
            const err = new Error(`Was invoked with no actual selectedAppointment. Sender method: ${senderMethod}`)
            this.log('ERROR', 'Human.onAppointmentSet', err.message)
            throw err
        }
        this.isSelectedAppointmentSet = true
        this.log('SUCCESS','Human.onAppointmentSet',`${senderMethod}\nAppointment details:\n
            date: ${this.selectedAppointment.date}\n
            day: ${this.selectedAppointment.hebrewDay}\n
            hour: ${this.selectedAppointment.hour}\n
        `)
    }
    async getTimeConstraints(): Promise<TimeConstraints> {
        let timeConstraints: TimeConstraints
        try {
            timeConstraints = await getTimeConstraints()
        } catch (err) {
            this.log('ERROR', 'human.getTimeConstraints', `Failed to get timeConstraints\n${err.message}`)
            throw err
        }
        this.AM.timeConstraints = timeConstraints
        return timeConstraints
    }
    async tryDetectUnauthorizedActivityMessage(): Promise<void> {
        this.waitLong()
        const found = await this.currentPage.evaluate(() => {
          const searchText = 'Unauthorized Activity Detected'
      
          function findTextInDOM(element: Element): boolean {
            if (element.textContent?.includes(searchText)) {
              return true;
            }
      
            for (const child of Array.from(element.children)) {
              if (findTextInDOM(child)) return true
            }
      
            return false;
          }
      
          return findTextInDOM(document.body)
        });
      
        if (found) {
          throw new Error('"Unauthorized Activity Detected" text found in page.');
        }
      }
}

import { Browser, Page } from "puppeteer";
import { Appointment } from "src/utils/types";
export class Human {
    isAppointmentSet: boolean = false
    currentPage: Page
    browser: Browser
    availableAppointments: Appointment[] = []

    

    constructor(browser: Browser, page: Page){
        this.browser = browser
        this.currentPage = page
    }

    /*
    * Pauses scenario for a random time of 2s-5s
    **/
    async waitLong() {
        const timeout = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000);
        return await new Promise(resolve => setTimeout(resolve, timeout));
    }
    /*
    * Pauses scenario for a random time of 1s-3s
    **/
    async waitShort() {
        const timeout = Math.floor(Math.random() * (3000 - 1000 + 1) + 1000);
        return await new Promise(resolve => setTimeout(resolve, timeout));
    }
    async findButtonAndClick(tagElement: string, innerText: string, className: string = "", id: string = "") {
        let elementToFind = tagElement;
    
        if (className) {
            elementToFind += `.${className}`;
        }
    
        if (id) {
            elementToFind += `#${id}`;
        }
    
        try {
            await this.currentPage.waitForFunction(
                (selector, text) => {
                    const elements = Array.from(document.querySelectorAll(selector));
                    return elements.some(el => el.textContent?.trim() === text);
                },
                { timeout: 30000 },
                elementToFind,
                innerText
            );
    
            // Now evaluate and click the element from the page context
            await this.currentPage.evaluate(
                (selector, text) => {
                    const elements = Array.from(document.querySelectorAll(selector));
                    const target = elements.find(el => el.textContent?.trim() === text);
                    if (target) (target as HTMLElement).click();
                },
                elementToFind,
                innerText
            );
        } catch (err) {
            console.error('Could not find or click the element:', err);
            this.exit();
        }
    }
    
    
    async delay(min: number, max: number) {
        const timeout = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    // Smooth scrolling behavior
    async smoothScroll(page: Page, targetY: number) {
        let currentPosition = 0;
        const step = 100; // Pixels per scroll
        while (currentPosition < targetY) {
            await page.evaluate((scrollStep) => {
                window.scrollBy(0, scrollStep);
            }, step);
            currentPosition += step;
            await this.delay(300, 700); // Small random delay
        }
    }

    // Randomized mouse movements
    async moveMouse(page: Page) {
        const viewport = await page.viewport();
        if (!viewport) return;

        const targetX = Math.floor(Math.random() * viewport.width);
        const targetY = Math.floor(Math.random() * viewport.height);
        
        await page.mouse.move(targetX, targetY, { steps: Math.floor(Math.random() * 20) + 10 });
        await this.delay(500, 1500);
    }

    // Randomized clicking to avoid bot detection
    async randomClick(page: Page, selector: string) {
        const element = await page.$(selector);
        if (element) {
            // Move mouse to element before clicking
            const box = await element.boundingBox();
            if (box) {
                const x = box.x + Math.random() * box.width;
                const y = box.y + Math.random() * box.height;

                await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 15) + 5 });
                await this.delay(300, 1000); // Human-like delay before clicking
                await page.mouse.down();
                await this.delay(50, 300);  // Vary click duration
                await page.mouse.up();
            }
        }
    }
    
    // Spoof user-agent and navigator properties
    async spoofBrowser(page: Page) {
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        );

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => false });
            Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
        });
    }


    async scrapeAppointments(): Promise<Appointment[]> {
        const appointments = await this.currentPage.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr.ItemStyle, tr.AlternatingItemStyle'));
            const results: Appointment[] = [];
        
            const datePattern = /^\d{2}\/\d{2}\/\d{4}$/; // dd/mm/yyyy
            const hebrewDayPattern = /יום [א-ש]/        
            const hourPattern = /^\d{2}:\d{2}$/;         // hh:mm

            rows.forEach((row, index) => {
                const spans = Array.from(row.querySelectorAll('td span'));
                let day = '';
                let hebrewDay = '';
                let hour = '';
        
                spans.forEach(span => {
                const text = span.textContent?.trim() || '';
                if (datePattern.test(text)) {
                    day = text;
                } else if (hebrewDayPattern.test(text)) {
                    hebrewDay = text
                } else if (hourPattern.test(text)) {
                    hour = text;
                }
                });
        
                if (day && hebrewDay && hour) {
                results.push({ day, hebrewDay, hour, rowNumber: index });
                }
            });
        
            return results;
        });
        this.availableAppointments = appointments
        return appointments;
    }
    async handleSelectInput(selector: string, optionLabelToSelect: string) {
        try {
          await this.currentPage.waitForSelector(selector);
          await this.currentPage.click(selector);
      
          await this.currentPage.evaluate((sel, label) => {
            const select = document.querySelector(sel) as HTMLSelectElement | null;
            if (!select) return;
      
            const option = Array.from(select.options).find(
              (o) => o.textContent?.trim() === label
            );
      
            if (option) {
              select.value = option.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, selector, optionLabelToSelect);
      
        } catch (err) {
          console.error(`Failed to select from ${selector}:`, err);
          this.exit();
        }
    }
    async handleTextInput(selector: string, textToInput: string) {
        try {
            await this.currentPage.waitForSelector(selector);
            const input = await this.currentPage.$(selector);
        
            if (!input) throw new Error(`Input not found: ${selector}`);
        
            await input.click({ clickCount: 3 }); // Select existing text if any
            await input.press('Backspace'); // Clear it
            await this.waitShort()
        
            for (const char of textToInput) {
              await input.type(char, { delay: 100 + Math.random() * 100 }); // delay between 100-200ms
            }
        
          } catch (err) {
            console.error(`Failed to type into ${selector}:`, err);
            this.exit();
          }
    }
    exit() {
        this.browser.close()
    }
}

import { NodeMailer } from "./src/utils/NodeMailer";
import { scrapeScript } from "./src/scrapeScript";

const ONE_MINUTE = 1000 * 60

async function runScrapeScript(startingDate: Date): Promise<Record<string, boolean>> {
  let isError = false
  const { isAppointmentSet, eventLog } = await scrapeScript(startingDate)
  console.log(eventLog);
  const nodeMailer = NodeMailer.init()
  
  if (isAppointmentSet) {
    await nodeMailer.sendEmail('SUCCESS! Doctors Appointment was set!', eventLog)
  } else if (eventLog.includes("ERROR")) {
    await nodeMailer.sendEmail('ERROR! Something went wrong', eventLog)
    isError = true
  } 

  return { isAppointmentSet, isError }
}

const main = async () => {
  const startingDate = new Date()
  let errorCounter = 0

  const { isAppointmentSet, isError } = await runScrapeScript(startingDate)
  if (isAppointmentSet) { return }
  if (isError) { errorCounter++ }
  
  const interval = setInterval(async () => {

    const { isAppointmentSet, isError } = await runScrapeScript(startingDate)

    if (isAppointmentSet || errorCounter === 3) {
      clearInterval(interval)
    }
    
    if (isError) {
      errorCounter++
    } else {
      errorCounter = 0
    }

  }, ONE_MINUTE * 30)
}

main()
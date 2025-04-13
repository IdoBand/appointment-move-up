import { NodeMailer } from "./src/utils/NodeMailer";
import { scrapeScript } from "./src/scrapeScript";
import { connectToDatabase, saveEventLogToDB } from "./src/utils/mongoDB/mongoDB";

const ONE_MINUTE = 1000 * 60

const nodeMailer = NodeMailer.init()

async function runScrapeScript(startingDate: Date): Promise<Record<string, boolean>> {
  let isError = false
  const { isAppointmentSet, eventLog } = await scrapeScript(startingDate)
  
  try {
    await saveEventLogToDB(eventLog)
  } catch {

  }

  if (isAppointmentSet) {
    await nodeMailer.sendEmail('SUCCESS! Doctors Appointment was set!', eventLog)
  } else if (eventLog.includes("ERROR")) {
    await nodeMailer.sendEmail('ERROR! Something went wrong', eventLog)
    isError = true
  } 

  return { isAppointmentSet, isError }
}

async function main() {
  
  try {
    await connectToDatabase()
  } catch {
    nodeMailer.sendEmail('ERROR - Failed to connect to MongoDB.', 'Sent from Appointment Move Up')
    return
  }

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
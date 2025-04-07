import { NodeMailer } from "./src/utils/NodeMailer";
import { scenario } from "./src/scenario";

const ONE_MINUTE = 1000 * 60

async function main () {

  const { isAppointmentSet, eventLog } = await scenario()
  // console.log(eventLog);
  const nodeMailer = NodeMailer.init()
  
  if (isAppointmentSet) {
    await nodeMailer.sendEmail('SUCCESS! Doctors Appointment was set!', eventLog)
  } else {
    if (eventLog.includes("ERROR")) {
      await nodeMailer.sendEmail('ERROR! Something went wrong', eventLog)
    }
  }
}
main()
// const main = setInterval(async () => {
//   console.log('interval stating');
  
//   const { isAppointmentSet, log } = await scenario()

//   if (isAppointmentSet) {
//     clearInterval(main)
//     // send myself an email

//   } else {
//     if (log.includes("ERROR")) {
//       // send myself an email
//     }
//   }

// }, ONE_MINUTE * 30)

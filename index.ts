import { scenario } from "./src/scenario";

const ONE_HOUR = 1000 * 60 * 60

async function main () {
  const { isAppointmentSet, eventLog } = await scenario()
  console.log(eventLog);
  
  if (isAppointmentSet) {
    // send myself an email

  } else {
    if (eventLog.includes("ERROR")) {
      // send myself an email
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

// }, ONE_HOUR)

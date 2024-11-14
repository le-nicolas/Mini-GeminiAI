//live assistant
// very similar to event management but on a higher level

/**configurations, modify these to fit your desired event schedule. */

const CONFIG = {
    startTimeCol: 'B', // This is the column for given start times
    endTimeCol: 'C', // This is the column for given end times
    actualStartTimecol: 'E', // This is the column for the actualy start time on the day of the event.
    actualEndTimeCol: 'F', // This is the column for the actual end time at the day of the event
    durationCol: 'M', // This is where the planned duration will be updated
    actualDurationCol: 'N', // measure of how much we follow the planned duration
    statusCol: 'K', // assistant will record the status(on schedule, running ahead, running late).
    sheetName: 'Schedule' // Name of the Event agenda
};

//**Key functions  */

function updateSchedule(){ // Function to calculate time differences and update event statuses. it runs periodically to refresh schedule based on actual times and current time.
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
    const range = sheet.getDataRange();
    const data = range.getValues();

    const now = new Date();

    // this now loop through each row in the schedule :)
    for (let i = 1; i < data.length; i++) { // this is important, this is where it troubled me earlier! Assume that the first row is headers :)
        let givenStart = data[i][columnToIndex(CONFIG.startTimeCol)];
        let givenEnd = data[i][columnToIndex(CONFIG.endTimeCol)];
        let actualStart = data[i][columnToIndex(CONFIG.actualStartTimecol)];
        let actualEnd = data[i][columnToIndex(CONFIG.actualEndTimeCol)];
        let statusCell = sheet.getRange(i + 1, columnToIndex(CONFIG.statusCol) + 1);


        // after we loop through, we now know something so we calculate time differences if actual times are provided
        let startDifference = actualStart ? (actualStart - givenStart) / (1000 * 60) : 0;    // dont forget to convert it in minutes
        let endDifference = actualEnd ? (actualEnd - givenEnd) / (1000 * 60) : 0;

        // Determine status based on start and end differences
        if (!actualStart && now >= givenStart) {
            statusCell.setValue("Scheduled");
        } else if (actualStart && !actualEnd) {
            statusCell.setValue(startDifference > 0 ? `Running late by ${startDifference} mins` : "On schedule");
        } else if (actualStart && actualEnd) {
            let durationDifference = endDifference + startDifference;
            statusCell.setValue(durationDifference > 0 ? `Completed - Overrun by ${durationDifference} mins` : "Completed - Ahead of schedule");
        } else {
            statusCell.setValue("Pending");
        }
    }


}
/**
 * Function to send alerts for late events.
 * This function will email the event organizer if an event is running late or delayed.
 */
function sendAlerts() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
const range = sheet.getDataRange();
  const data = range.getValues();
  
  const email = "youremail@example.com"; // Set your email for alerts
  let alerts = [];
  
  for (let i = 1; i < data.length; i++) {
    let status = data[i][columnToIndex(CONFIG.statusCol)];
    if (status.includes("late") || status.includes("Overrun")) {
      let eventName = data[i][0]; // Assumes first column is the event name
      alerts.push(`Alert: ${eventName} is ${status}`);
    }
  }
  
  if (alerts.length > 0) {
    MailApp.sendEmail({
      to: email,
      subject: "Event Schedule Alerts",
      body: alerts.join("\n")
    });
  }
}

/**
 * Utility function to convert column letters to index.
 */
function columnToIndex(colLetter) {
  return colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
}

/**
 * Function to generate a summary of session trends.
 */
function generateSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.sheetName);
  const range = sheet.getDataRange();
  const data = range.getValues();
  
  let totalOverrun = 0;
  let totalAhead = 0;
  let totalEvents = 0;
  
  for (let i = 1; i < data.length; i++) {
    let status = data[i][columnToIndex(CONFIG.statusCol)];
    if (status.includes("Overrun")) {
      let overrun = parseInt(status.match(/Overrun by (\d+)/)[1]);
      totalOverrun += overrun;
      totalEvents++;
    } else if (status.includes("Ahead of schedule")) {
      let ahead = parseInt(status.match(/Ahead by (\d+)/)[1]);
      totalAhead += ahead;
      totalEvents++;
    }
  }
  
  const avgOverrun = totalOverrun / totalEvents || 0;
  const avgAhead = totalAhead / totalEvents || 0;
  
  sheet.getRange("M1").setValue(`Average Overrun: ${avgOverrun.toFixed(1)} mins`);
  sheet.getRange("M2").setValue(`Average Ahead: ${avgAhead.toFixed(1)} mins`);
}


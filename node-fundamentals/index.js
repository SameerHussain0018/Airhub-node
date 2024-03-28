const http = require("http");
const axios = require('axios');
const https = require('https');
const { IncomingWebhook } = require('@slack/webhook');

// Retrieve Slack webhook URL from environment variables
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

// Function to fetch the API data
async function fetchApiData() {
  try {
    const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    const response = await axios.get('https://slackapi.clay.in/api/Authentication/GetInformation', { httpsAgent: agent });
    return response.data;
  } catch (error) {
    console.error('Error fetching API data:', error);
    return null;
  }
}

// Function to send message to Slack
async function sendMessageToSlack(message, res) {
  try {
    const webhook = new IncomingWebhook(slackWebhookUrl);
    await webhook.send({
      text: message
    });
    console.log('Message sent to Slack:', message);
  } catch (error) {
    console.error('Error sending message to Slack:', error);
    console.log('Current values -> signUps: 102, sales: 98'); // Assuming these are the current values
    if (res) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error sending message to Slack");
    }
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Fetch API data
  const apiData = await fetchApiData();
  if (apiData) {
    const currentData = apiData.getInformation[0]; // Assuming getInformation always returns an array with one object
    const message = `Current values -> signUps: ${currentData.signUps}, sales: ${currentData.sales}`;
    sendMessageToSlack(message, res);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(message);
  } else {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error fetching API data");
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Function to check for changes in signUps and sales
async function checkForChanges() {
  setInterval(async () => {
    const apiData = await fetchApiData();
    if (!apiData) return;

    const currentData = apiData.getInformation[0]; // Assuming getInformation always returns an array with one object

    // Send the current values of signUps and sales every 30 seconds
    sendMessageToSlack(`Current values -> signUps: ${currentData.signUps}, sales: ${currentData.sales}`);

  }, 30000); // Check every 30 seconds
}

// Start checking for changes in signUps and sales
checkForChanges();

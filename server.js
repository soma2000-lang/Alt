const http = require('http');
const https = require('https');
const fs = require('fs');
const JSONStream = require('JSONStream');
const winston = require('winston');
// const logger = require('./logger').createLogger(); 

let jsonData = [];

fs.createReadStream('data.json')
  .pipe(JSONStream.parse('*'))
  .on('data', (data) => {
    jsonData.push(data);
  })
  .on('end', () => {
    console.log('Finished reading JSON file.');
  })
  .on('error', (error) => {
    console.error('Error reading JSON file:', error);
    process.exit(1);
  });

const apiUrl = 'https://api.example.com/endpoint';
let isSending = false;
let requestInterval = null;

function sendRequest(data) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = https.request(apiUrl, options, (res) => {
    res.on('data', () => {});
    res.on('end', () => {
      console.log('Request sent successfully');
    });
  });

  req.on('error', (error) => {
    console.error('Error sending request:', error);
  });

  req.write(JSON.stringify(data));
  req.end();
}

const delayBetweenRequests = 1; 

function startSending() {
  if (!isSending && jsonData.length > 0) {
    isSending = true;
    console.log('Starting to send data at 1000 rps...');
    requestInterval = setInterval(() => {
      if (isSending && jsonData.length > 0) {
        sendRequest(jsonData.shift()); // Send one item and remove it from the array
      }
    }, delayBetweenRequests);
  }
}



const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    startSending();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Data sending started');
  }  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Send a POST request to /start to begin sending data');
  console.log('Send a POST request to /stop to stop sending data');
});

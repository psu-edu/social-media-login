const { google }          = require('googleapis');
const fs                  = require('fs');
const path                = require('path');
const CREDENTIALS_FOLDER  = './';
const SCOPES              = ['https://www.googleapis.com/auth/gmail.send'];

/* GLOBAL VARIABLES*/
let credentials;


// ----------  OAUTH2 CLIENT ----------------
// Load client secrets into "credentials"
try {
  const files = fs.readdirSync(CREDENTIALS_FOLDER);
  const credentialsFile = files
    .find(file => file.startsWith('client_secret_') && file.endsWith('.json'));

  if (!credentialsFile) throw new Error('credentials file not found');

  // const credentialsPath = CREDENTIALS_FOLDER + credentialsFile;
  const credentialsPath = path.join(__dirname, CREDENTIALS_FOLDER, credentialsFile);
  const file = fs.readFileSync(credentialsPath, 'utf8');
  credentials = JSON.parse(file);
} catch (error) {
  console.log("unable to read file, can't continue");
}

// VALIDATE CREDENTIALS 
const REQUIRED_CREDENTIALS_PROPERTIES = [
  'client_id',
  'project_id',
  'auth_uri',
  'auth_provider_x509_cert_url',
  'token_uri',
  'client_secret',
  'redirect_uris'
];

// Ensure all required properties exist
if (!credentials || !credentials.installed) {
  throw new Error('credentials or installed not found in credentials');
}

REQUIRED_CREDENTIALS_PROPERTIES.forEach(prop => {
  if (!(prop in credentials.installed)) 
    throw new Error(`Property ${prop} not found in credentials`);
});

const { installed: { client_id, client_secret, redirect_uris } } = credentials;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

let authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES
});

// ----------  EXPRESS APPLICATION  ----------------
const express = require('express');
const app     = express();

app.get('/', (req, res) => {
  res.send(`<a href="${authUrl}">Authorize</a>`);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    res.redirect('/authenticated');
});

app.get('/authenticated', (req, res) => {
  res.send('You are authenticated now!');
});
// ----------  EXPRESS FALLBACKS  ----------------
function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found - ' + req.originalUrl);
  next(error);
}
function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    stack: err.stack
  });
}
app.use(notFound);
app.use(errorHandler);

// gets the localhost IP address
var interfaces = require('os').networkInterfaces(), localhostIP;
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        let ipFamily = interfaces[k][k2].family;
       if ( ipFamily === 'IPv4' || ipFamily === 4 && !interfaces[k][k2].internal) {
          localhostIP = interfaces[k][k2].address;
       }
   }
}

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Listening on http://${localhostIP}:${port}`);
});
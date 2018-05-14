const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const plaid = require('plaid');

const { PLAID_PUBLIC_KEY } = process.env;

const PLAID_ENV = 'development';

// We store the access_token in memory - in production, store it in a secure
// persistent data store
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;

const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize the Plaid client
const client = new plaid.Client(
  process.env.PLAID_CLIENT_ID,
  process.env.PLAID_SECRET,
  process.env.PLAID_PUBLIC_KEY,
  plaid.environments[PLAID_ENV]
);

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(bodyParser.json());

app.get('/', (request, response) => {
  response.render('index.ejs', {
    PLAID_PUBLIC_KEY,
    PLAID_ENV,
  });
});

app.post('/get_access_token', (request, response) => {
  PUBLIC_TOKEN = request.body.public_token;
  client.exchangePublicToken(PUBLIC_TOKEN, (error, tokenResponse) => {
    if (error != null) {
      return response.json({
        error,
      });
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    return response.json({
      error: false,
    });
  });
});

app.get('/accounts', (request, response) => {
  // Retrieve high-level account information and account and routing numbers
  // for each account associated with the Item.
  client.getAuth(ACCESS_TOKEN, (error, authResponse) => {
    if (error != null) {
      const msg = 'Unable to pull accounts from the Plaid API.';
      console.log(msg, '\n', error);

      return response.json({
        error: msg,
      });
    }

    console.log(authResponse.accounts);

    return response.json({
      error: false,
      accounts: authResponse.accounts,
      numbers: authResponse.numbers,
    });
  });
});

app.post('/item', (request, response) => {
  // Pull the Item - this includes information about available products,
  // billed products, webhook information, and more.
  client.getItem(ACCESS_TOKEN, (error, itemResponse) => {
    if (error != null) {
      console.log(JSON.stringify(error));
      return response.json({
        error,
      });
    }

    // Also pull information about the institution
    return client.getInstitutionById(itemResponse.item.institution_id, (err, instRes) => {
      if (err != null) {
        const msg = 'Unable to pull institution information from the Plaid API.';
        console.log(msg, '\n', error);
        return response.json({
          error: msg,
        });
      }
      return response.json({
        item: itemResponse.item,
        institution: instRes.institution,
      });
    });
  });
});

app.post('/transactions', (request, response) => {
  // Pull transactions for the Item for the last 30 days
  const startDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
  const endDate = moment().format('YYYY-MM-DD');
  client.getTransactions(ACCESS_TOKEN, startDate, endDate, {
    count: 250,
    offset: 0,
  }, (error, transactionsResponse) => {
    if (error != null) {
      console.log(JSON.stringify(error));
      return response.json({
        error,
      });
    }
    console.log(JSON.stringify(transactionsResponse));

    let twilioBody = '';

    console.log('start twilio send');
    transactionsResponse.transactions.forEach((transaction) => {
      const line = transaction.name + transaction.amount.toString();

      twilioBody += '\n' + line;
    });

    return twilioClient.messages.create({
      body: twilioBody,
      from: '+17342593805',
      to: '+18109235555',
    })
      .then(message => console.log('sent twilio message: ', message.sid))
      .catch(error2 => console.log('error: ', error2));
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('plaid-walkthrough server listening on port ', port);
});

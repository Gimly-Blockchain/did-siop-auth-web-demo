import * as dotenv from 'dotenv';
import express from "express";

import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const secret = process.env.COOKIE_SIGNING_KEY;
app.use(cookieParser(secret));

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`));

// create a GET route
app.get('/authenticate', (request, response) => {
  const options = {
    signed: true
  };

  response.cookie('auth-state', 'authenticated', options).send({authenticated: true});
});
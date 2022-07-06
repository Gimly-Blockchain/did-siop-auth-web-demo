/*const awsServerlessExpress = require('aws-serverless-express');
const app = require('./src/server');
const server = awsServerlessExpress.createServer(app)

module.exports.universal = (event, context) => awsServerlessExpress.proxy(server, event, context);*/

import "source-map-support/register";
import serverlessExpress from "@vendia/serverless-express";
import app from './src/server';

export const handler = serverlessExpress({ app });
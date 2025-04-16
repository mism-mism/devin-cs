// @ts-ignore
import serverless from 'serverless-http';
import app from './index';

// Wrap Express app with serverless-http
export const handler = serverless(app);
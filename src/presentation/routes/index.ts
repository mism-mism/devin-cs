import express from 'express';
import { LineController } from '../controllers/LineController';
import { SlackController } from '../controllers/SlackController';

export function setupRoutes(
  app: express.Application,
  lineController: LineController,
  slackController: SlackController
): void {
  // Set up LINE webhook route
  app.use('/webhook/line', lineController.getRouter());
  
  // Set up Slack interaction route
  app.use('/webhook/slack', slackController.getRouter());
}
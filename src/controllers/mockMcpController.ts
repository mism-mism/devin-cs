import express from 'express';
import { generateMockCustomerData, generateMockOrderData } from '../services/mockMcpService';

const router = express.Router();

// Get customer data by userId
router.get('/customer/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const customerData = generateMockCustomerData(userId);
    res.status(200).json(customerData);
  } catch (error) {
    console.error('Error getting customer data:', error);
    res.status(500).json({ error: 'Failed to get customer data' });
  }
});

// Get order data by userId
router.get('/orders/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const orderData = generateMockOrderData(userId);
    res.status(200).json(orderData);
  } catch (error) {
    console.error('Error getting order data:', error);
    res.status(500).json({ error: 'Failed to get order data' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export const mockMcpRouter = router;
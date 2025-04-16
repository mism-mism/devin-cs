import axios from 'axios';

// Types for mock data
export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  membershipLevel: string;
  registrationDate: string;
  lastPurchaseDate: string;
}

export interface OrderData {
  id: string;
  customerId: string;
  orderDate: string;
  status: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
}

/**
 * Generate mock customer data based on userId
 * @param userId The LINE user ID
 * @returns Mock customer data
 */
export function generateMockCustomerData(userId: string): CustomerData {
  // Generate deterministic data based on userId
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const membershipLevels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const membershipLevel = membershipLevels[hash % membershipLevels.length];
  
  // Generate a date in the past (1-365 days ago)
  const getRandomPastDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - (hash % days));
    return date.toISOString().split('T')[0];
  };
  
  return {
    id: `CUST-${hash.toString().padStart(6, '0')}`,
    name: `顧客 ${hash % 1000}`,
    email: `customer${hash % 1000}@example.com`,
    phone: `090-${Math.floor(1000 + hash % 9000)}-${Math.floor(1000 + (hash * 2) % 9000)}`,
    address: `東京都渋谷区代々木${hash % 10}-${hash % 100}-${hash % 1000}`,
    membershipLevel,
    registrationDate: getRandomPastDate(365),
    lastPurchaseDate: getRandomPastDate(30)
  };
}

/**
 * Generate mock order data based on userId
 * @param userId The LINE user ID
 * @returns Mock order data
 */
export function generateMockOrderData(userId: string): OrderData[] {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const customerData = generateMockCustomerData(userId);
  
  // Generate 1-5 orders
  const orderCount = (hash % 5) + 1;
  const orders: OrderData[] = [];
  
  const statuses = ['配送中', '処理中', '完了', 'キャンセル'];
  const productNames = ['商品A', '商品B', '商品C', '商品D', '商品E'];
  
  for (let i = 0; i < orderCount; i++) {
    const itemCount = (hash % 3) + 1;
    const items = [];
    let totalAmount = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const price = 1000 + ((hash + j) % 10) * 500;
      const quantity = ((hash + j) % 3) + 1;
      totalAmount += price * quantity;
      
      items.push({
        id: `ITEM-${(hash + j).toString().padStart(6, '0')}`,
        name: productNames[(hash + j) % productNames.length],
        price,
        quantity
      });
    }
    
    // Generate a date in the past (1-30 days ago)
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - ((hash + i) % 30));
    
    orders.push({
      id: `ORDER-${(hash + i).toString().padStart(6, '0')}`,
      customerId: customerData.id,
      orderDate: orderDate.toISOString().split('T')[0],
      status: statuses[(hash + i) % statuses.length],
      items,
      totalAmount
    });
  }
  
  return orders;
}

/**
 * Get customer data from mock MCP server
 * @param userId The LINE user ID
 * @returns Customer data with orders
 */
export async function getMockCustomerData(userId: string): Promise<{
  customer: CustomerData;
  orders: OrderData[];
}> {
  try {
    // In a real implementation, this would call the actual MCP API
    // For now, we'll use our mock data generators
    const mockServerBaseUrl = process.env.MOCK_SERVER_URL || 'http://localhost:3000/mock-mcp';
    
    // For local development, we can use the mock data directly
    if (process.env.NODE_ENV === 'development') {
      return {
        customer: generateMockCustomerData(userId),
        orders: generateMockOrderData(userId)
      };
    }
    
    // For production, we would call the mock server API
    const [customerResponse, ordersResponse] = await Promise.all([
      axios.get(`${mockServerBaseUrl}/customer/${userId}`),
      axios.get(`${mockServerBaseUrl}/orders/${userId}`)
    ]);
    
    return {
      customer: customerResponse.data,
      orders: ordersResponse.data
    };
  } catch (error) {
    console.error('Error getting mock customer data:', error);
    throw new Error('Failed to get customer data');
  }
}
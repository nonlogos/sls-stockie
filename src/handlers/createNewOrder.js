import AWS from 'aws-sdk';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import Alpaca from '../lib/alpacaApiHelper';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function createNewOrder(event, context) {
  try {
    const stage = process.env.STAGE;
    const { ticker, shares, price } = event;
    if (!ticker || !shares || !price) {
      throw new Error('missing ticker, shares or price data');
     }
    const data = {
      symbol: ticker,
      qty: String(shares),
      side: 'buy',
      type: 'limit',
      time_in_force: 'day',
      limit_price: String(price),
    }

    const alpaca = new Alpaca(context);
    const order = await alpaca.postRequest('orders', data);
    console.info('order', order);
    if (order) {
      console.info('does it get in here?')
      await dynamoDB.put({
        TableName: `stockieBotOrders-${stage}`,
        Item: order
      }).promise();
    }

    return order;
    
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const handler = getParamsStoreMiddleware(createNewOrder);

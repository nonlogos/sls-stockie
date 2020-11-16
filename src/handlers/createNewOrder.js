import AWS from 'aws-sdk';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import Alpaca from '../lib/alpacaApiHelper';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function createNewOrder(event, context) {
  try {
    const stage = process.env.STAGE;
    const { ticker, shares, price, side } = event;
    if (!ticker || !shares || !price) {
      throw new Error('missing ticker, shares or price data');
    }

    const alpaca = new Alpaca(context);
    // check if an open position already exist for this stock
    // if so exists and do not create the order
    if (side === 'buy') {
      const positionEndpoint = `positions/${ticker}`;
      const positionExists = await alpaca.getRequest(positionEndpoint);
      if (positionExists) {
        return null;
      }
    }

    // otherwise creates and submits a new order
    const data = {
      symbol: ticker,
      qty: String(shares),
      side,
      type: 'limit',
      time_in_force: 'day',
      limit_price: String(price),
    }

    const order = await alpaca.postRequest('orders', data);
    console.info('order', order);
    if (order) {
      // if the new order is submitted to Alpaca successfully
      // add a new order record to db table
      await dynamoDB.put({
        TableName: `stockieBotOrders-${stage}`,
        Item: order
      }).promise();
    }

    return order;
    
  } catch (error) {
    console.error(error);
    // returning null here to keep the rest of the step function map iterations going if any single request fails.
    return null;
  }
}

export const handler = getParamsStoreMiddleware(createNewOrder);

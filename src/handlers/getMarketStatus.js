import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import Alpaca from '../lib/alpacaApiHelper';

async function getMarketStatus(event, context) {
  try {
    const stage = process.env.STAGE;
    const alpaca = new Alpaca(context);
    
    const marketStatus = await alpaca.getRequest('clock');

    return { ...marketStatus, stage };
    
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const handler = getParamsStoreMiddleware(getMarketStatus);

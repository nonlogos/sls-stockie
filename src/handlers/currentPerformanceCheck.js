import axios from 'axios';
import createError from 'http-errors';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';

async function currentPerformanceCheck(event, context) {
  try {
    const defaultResult = { ticker: null };
    if (!event.ticker) { 
      return defaultResult;
    }
    const { POLYGON_LIVE_API_ENDPOINT } = process.env;
    const { ALPACA_LIVE_API_KEY } = context;
    const { ticker } = event;
    console.info('ticker', ticker);
  
    const url = `${POLYGON_LIVE_API_ENDPOINT}/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`;
    const currentPerf = await axios.get(url, {
      params: { apiKey: ALPACA_LIVE_API_KEY },
    });

    const { data } = currentPerf;
    console.info('currentPerf', data, data.ticker.todaysChangePerc);
    return (data.ticker.todaysChangePerc > 0) ? { ticker: data.ticker } : defaultResult;
    
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const handler = getParamsStoreMiddleware(currentPerformanceCheck);

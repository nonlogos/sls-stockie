import axios from 'axios';
import createError from 'http-errors';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';

async function currentPerformanceCheck(event, context) {
  try {
    if (!event.result) { 
      return null;
    }
    const { POLYGON_LIVE_API_ENDPOINT } = process.env;
    const { ALPACA_LIVE_API_KEY } = context;
    const { ticker } = event.result;
    console.info('ticker', ticker);
  
    const url = `${POLYGON_LIVE_API_ENDPOINT}/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`;
    const currentPerf = await axios.get(url, {
      params: { apiKey: ALPACA_LIVE_API_KEY },
    });

    const { data } = currentPerf;
    console.info('currentPerf', data, data.ticker.todaysChangePerc);
    return (data.ticker.todaysChangePerc > 0) ? { ticker: data.ticker } : null;
    
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
}

export const handler = getParamsStoreMiddleware(currentPerformanceCheck);

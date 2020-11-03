import createError from 'http-errors';
import axios from 'axios';
import macd from 'macd';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import commonMiddleware from '../lib/commonMiddlewares';
import { getDateString } from '../lib/stockSelectionHelpers';

// 1. from the array of stocks in input, call Polygon's aggregates api to get last 3 month data for each stock
// 2. run MACD from this data for each stock
// 3. Check MACD with histogram
// 4. returns a list of stocks that passed the MACD check

async function getMACDStockList(event, context) {
  try {
    const { POLYGON_LIVE_API_ENDPOINT } = process.env;
    const { ALPACA_LIVE_API_KEY } = context;
    const { ticker } = event;
    console.info('ticker', ticker);
    let MACDList;

    if (!ticker || typeof ticker !== 'string') {
      throw new Error('No stock ticker is found');
    }
    const to = new Date();
    let from = new Date();
    from = from.setMonth(from.getMonth() - 2);
    const fromDate = new Date(from);
    const toDateString = getDateString(to);
    const fromDateString = getDateString(fromDate);

    const stickerUrl = `${POLYGON_LIVE_API_ENDPOINT}/v2/aggs/ticker/${ticker}/range/1/day/${fromDateString}/${toDateString}`;
    const historicData = await axios.get(stickerUrl, { params: { apiKey: ALPACA_LIVE_API_KEY } });
    const { results, ticker: stockTicker } = historicData.data;
    let isPositiveMACD = false;
    if (results && Array.isArray(results)) {
      const aggregateData = results.map(result => result.c);
      const macdResult = macd(aggregateData, 5, 35, 5);
      const { MACD } = macdResult;
      console.info('MACD', MACD[MACD.length - 1])
      if (MACD && MACD[MACD.length - 1] > 0) { 
        isPositiveMACD = true;
      }
    }
    return isPositiveMACD ? { ticker: stockTicker } : null;

  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
}
export const handler = getParamsStoreMiddleware(getMACDStockList).use(commonMiddleware);

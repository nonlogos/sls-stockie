import macd from 'macd';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import commonMiddleware from '../lib/commonMiddlewares';
import {getTodaysBars, getHighestPrice, getHistoricData, isMACDPositive } from '../lib/stockSelectionHelpers';

async function stockToBuy(event, context) {
  try {
    const { POLYGON_LIVE_API_ENDPOINT } = process.env;
    const { ALPACA_LIVE_API_KEY } = context;
    const { ticker } = event;
    console.info('ticker', ticker);

    if (!ticker || typeof ticker !== 'string') {
      throw new Error('No stock ticker is found');
    }

    const bars = await getHistoricData(ticker, 1000, context);
    const defaultResult = { ticker: null }
    let tickerToBuy = {};
    
    console.info('bars', bars);
    if (bars && Array.isArray(bars) && bars.length > 0) {
      const todaysBars = getTodaysBars(bars);
      if (todaysBars && todaysBars.length > 0) {
        const todaysHighestPrice = getHighestPrice(todaysBars);
        const latestClosingPrice = bars.pop().c;
  
        // 1. check if current price is higher than the highest reached today so far
        if (latestClosingPrice < todaysHighestPrice) {
          console.info('latestClosingPrice: ', latestClosingPrice, todaysHighestPrice)
          return defaultResult;
        }
      } else {
        return defaultResult;
      }
      // 2. check for a positive, increasing MACD
      const aggregatedClosingPrice = bars.map(bar => bar.c);
      const shortTerm = macd(aggregatedClosingPrice);
      const longterm = macd(aggregatedClosingPrice, 40, 60);
      console.info('shortterm ', isMACDPositive(shortTerm.MACD))
      console.info('longterm ',  isMACDPositive(longterm.MACD, true))
  
      if (isMACDPositive(shortTerm.MACD) && isMACDPositive(longterm.MACD, true)) {
        tickerToBuy = {
          ticker,
          lastBar: bars[bars.length - 1]
        }
      }
    }

    return Object.keys(tickerToBuy).length > 0 ? tickerToBuy : defaultResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
export const handler = getParamsStoreMiddleware(stockToBuy).use(commonMiddleware);

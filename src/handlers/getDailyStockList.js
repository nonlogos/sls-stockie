import createError from 'http-errors';
import axios from 'axios';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import commonMiddleware from '../lib/commonMiddlewares';
import { calculateIncreasePercentage, getDateString } from '../lib/stockSelectionHelpers';

// 1. pull date's data from Polygon's all tickers api for the whole market {local}, {market}, {date}
// 2. filter the list for stocks that has a 3.5% increase btw opening{o} and closing prices{c} and min_price >= {min_price}, max_price <= {max_price}
// 3. filter with min_last_dv ex. ticker.prevDay['v'] * ticker.lastTrade['p'] > {min_last_dv}// default 500000
// 4. sort by prevDay's highest increasePerc and returns the top 10

async function getDailyStockList(event, context) {
  try {
    const { POLYGON_LIVE_API_ENDPOINT, MIN_LAST_DV } = process.env;
    const { ALPACA_LIVE_API_KEY } = context;
    const { minPrice, maxPrice, increasePercentage } = event;

    const url = `${POLYGON_LIVE_API_ENDPOINT}/v2/snapshot/locale/us/markets/stocks/tickers`;
    const prevDayPerf = await axios.get(url, {
      params: { apiKey: ALPACA_LIVE_API_KEY },
    });
    const { data } = prevDayPerf;
    if (!data || !data.tickers || !Array.isArray(data.tickers) || data.tickers.length === 0) {
      return { tickers: null };
     }
    const stockList = prevDayPerf.data.tickers
      .filter((ticker) => {
        const { c: close, o: open, v: volume } = ticker.prevDay;
        const { p: lastTradePrice } = ticker.lastTrade;
        const tickerIncreasePercentage = calculateIncreasePercentage(open, close);
        ticker.increasedPerc = tickerIncreasePercentage;
        const matchedIncreasedPerc = increasePercentage
          ? tickerIncreasePercentage >= increasePercentage
          : tickerIncreasePercentage >= process.env.INCREASE_PERCENTAGE;
        const matchedMinAndMaxPrice = close >= minPrice && close <= maxPrice;
        const matchedMinLastDv = volume * lastTradePrice > MIN_LAST_DV;
        return matchedIncreasedPerc && matchedMinAndMaxPrice && matchedMinLastDv;
      })
      .sort((a, b) => b.increasedPerc - a.increasedPerc)
      .slice(0, 40)
      .map(stock => ({ ticker: stock.ticker }));
    
    console.info('stockList', stockList);
    const tickers = (stockList && Array.isArray(stockList) && stockList.length > 0) ? stockList : null;

    return {
      tickers
    }

  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
}
export const handler = getParamsStoreMiddleware(getDailyStockList).use(commonMiddleware);

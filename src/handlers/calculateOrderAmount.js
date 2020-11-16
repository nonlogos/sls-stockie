import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import Alpaca from '../lib/alpacaApiHelper';

async function calculateOrderAmount(event, context) {
  try {
    const list = [ ...event ];
    console.info('list', list, list.length)
    const stage = process.env.STAGE;
    if (!Array.isArray(list) || list.length < 1) { 
      return null;
    }
    // filter out the stocks that failed previous tests
    const stockList = list
      .filter(stock => (stock.ticker && stock.lastBar))
      .slice(0, 10);

    if (stockList.length < 1) { 
      return null;
    }

    const { DEFAULT_STOP_PERC, RISK } = process.env;
    const alpaca = new Alpaca(context);

    const accountInfo = await alpaca.getRequest('account');
    if (!accountInfo && !accountInfo.cash) {
      throw new Error('Account Api is missing data or data.cash');
    }
    
    const totalInvestingAmount = (stage === 'dev') ? 10000 : accountInfo.cash * 0.25;
   
    if (totalInvestingAmount < 1) { 
      return null;
    }

    const sharesToBuyPerStock = stockList.map(stock => {
      const maxOrderAmount = totalInvestingAmount / stockList.length;
      const currentValue = stock.lastBar.c;
      const defaultStop = currentValue * DEFAULT_STOP_PERC;
      const estimatedShares = Math.floor(totalInvestingAmount * RISK * defaultStop);
      const orderAmount = estimatedShares * currentValue;
      let sharesToBuy = estimatedShares;
      if (orderAmount > maxOrderAmount) {
        sharesToBuy = Math.floor(maxOrderAmount / currentValue);
      }
      const percOfTotalInvestment = (sharesToBuy * currentValue) / totalInvestingAmount * 100;
      console.info('stock', stock.ticker, sharesToBuy);
      return { ticker: stock.ticker, shares: sharesToBuy, price: currentValue, percOfTotalInvestment, side: 'buy' };
    })
    
    return { sharesToBuy: sharesToBuyPerStock };
    
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const handler = getParamsStoreMiddleware(calculateOrderAmount);

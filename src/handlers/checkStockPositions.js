import macd from 'macd';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import Alpaca from '../lib/alpacaApiHelper';
import { isMarketClosing, setSellOrderObj,stopLossTargetMet, macdTargetMet } from '../lib/stockSelectionHelpers';

async function checkStockPositions(event, context) {
  try {
    const { DEFAULT_STOP_PERC } = process.env;
    const alpaca = new Alpaca(context);
    const noStockToSell = { stocksToSell: null };
    
    const positions = await alpaca.getRequest('positions');

    if (positions && Array.isArray(positions) && positions.length > 0) {

      // get existing open orders
      const existingOrders = await alpaca.getRequest('orders');

      // filter out positions where open order already exists to avoid duplicating orders
      const unsoldPositions = positions.filter(async position => {
        const { symbol } = position;
        const orderAlreadyExist = existingOrders.find(order => order.symbol === symbol);
        return orderAlreadyExist === false;
      })

      // ===== 1. if market is about to close, sell all positions ================
      if (isMarketClosing()) {
        const sellAll = unsoldPositions.map(position => setSellOrderObj(position));
        return { stocksToSell: sellAll };
      }
      // ===== 2. get positions that have fallen to reach their stoploss targets =
      let stocksToSell = [];
      const stopLossCheckResults = stopLossTargetMet(unsoldPositions, DEFAULT_STOP_PERC);
      const { stopLossMet, remainingPositions } = stopLossCheckResults;
      if (stopLossMet) { 
        stocksToSell = [...stopLossMet];
      }

      // 3 -- -- check if latest MACD reaches below 0 and
      const macdCheckpromises = remainingPositions.map(async position => {
        const conditionMet = await macdTargetMet(position, DEFAULT_STOP_PERC, context);
        if (conditionMet) {
          stocksToSell.push(position);
        }
      });
      // run MACD check for each of the open positions
      await Promise.all(macdCheckpromises);

      if (stocksToSell.length > 0) { 
        return stocksToSell.map(position => setSellOrderObj(position));
      }
      return noStockToSell;
    }
    return noStockToSell;
    
  } catch (error) {
    console.error(error);
    return {};
  }
}

export const handler = getParamsStoreMiddleware(checkStockPositions);

// get all open positions
// - no positions => end
// - yes positions => Sell
//   -- check if time is 3:50pm EST => sell all
//   -- check if position reaches stop loss: current_price >= avg_entry_price * 0.95
//   -- check if position reaches target price: avg_entry_price + ((avg_entry_price - stoploss) * 3)
//   -- check if latest MACD reaches below 0
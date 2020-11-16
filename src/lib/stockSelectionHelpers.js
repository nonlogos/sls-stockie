import macd from 'macd';
import Alpaca from './alpacaApiHelper';

export function calculateIncreasePercentage(currentNum, newNum) {
  try {
    if ((!currentNum && currentNum !== 0) || (!newNum && newNum !== 0)) {
      throw new Error('an currentNum and newNumber number values are required');
    }
    return ((Number(newNum) - Number(currentNum)) / Number(currentNum)) * 100;
  } catch (error) {
    console.error(`[calculateIncreasePercentage]: ${error}`);
    throw error;
  }
}

export function getDate(time) {
  try {
    if (!time) {
      throw new Error('a valid unix timestamp or date object is required');
    }
    const dtFormat = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeZone: 'America/New_York'
    })

    return (time instanceof Date) ? dtFormat.format(time) : dtFormat.format(new Date(time * 1e3));
    
  } catch (error) {
    console.error(`[getDateFromTimestamp]: ${error}`);
    throw error;
  }
}

export function getTodaysBars(barsArr) {
  try {
    if (!barsArr || !Array.isArray(barsArr) || !barsArr.length) { 
      throw new Error('a valid barsArr array argument is required');
    }

    return barsArr
      .filter(bar => {
        const today = new Date();
        const currentDateStr = getDate(today);
        const barDateStr = getDate(bar.t);
        return currentDateStr === barDateStr;
      })

  } catch (error) { 
    console.error(`[getTodaysHighestPrice]: ${error}`);
    throw error;
  }
}

export function getHighestPrice(barsArr) { 

  try {
    if (!barsArr || !Array.isArray(barsArr) || !barsArr.length) { 
      throw new Error('a valid barsArr array argument is required');
    }
  
    return barsArr
      .map(bar => bar.h)
      .reduce((acc, curr) => Math.max(acc, curr));

  } catch (error) { 
    console.error(`[getHighestPrice]: ${error}`);
    throw error;
  }
}

export async function getHistoricData(ticker, limit, context) {
  try {
    if (!ticker || !limit || !context) { 
      throw new Error('A valid ticker and limit and context are required');
    }
    const alpaca = new Alpaca(context);
    const params = { symbols: ticker, limit };
    const aggregatedBars = await alpaca.getRequest('bars/minute', 'v1', params);
    return aggregatedBars[ticker] ? aggregatedBars[ticker] : null;
  } catch (error) {
    console.error(`[getHistoricData]: ${error}`);
    throw error;
   }
 }

export function isMACDPositive(data, latest) { 
  try {
    if (!data || !Array.isArray(data)) {
      throw new Error('a valid data array is required');
    }
    const last3Bars = data.slice(data.length - 3);
    const latestBar = last3Bars[2]; 

    if (latest) {
      return ( latestBar >= 0) && (latestBar >= last3Bars[1] >= last3Bars[0]);
    }

    return latestBar >= 0;
    

  } catch (error) { 
    console.error(`[isMACDPositive]: ${error}`);
    throw error;
  }
  
}

export function isMarketClosing() { 
  const currentTime = new Date();
  const currentUTCHr = currentTime.getUTCHours();
  const currentUTCMin = currentTime.getUTCMinutes();
  return (currentUTCHr >= 20 && currentUTCMin >= 54);
}

export function setSellOrderObj(position) {
  if (!position) { 
    throw new Error('a valid position object is required');
  }
  const { symbol, current_price: currPrice, qty } = position;
  if (!symbol || !currPrice || !qty) {
    return null;
  }
  
  const order = {
    ticker: symbol,
    shares: qty,
    price: currPrice,
    side: 'sell'
  }

  return order;
}

export function stopLossTargetMet(arr, perc) {
  const conditionNotMet = [];
  const stopLossPerc = perc || 0.95;
  const conditionMet =  arr.reduce((acc, curr) => { 
    const { current_price: currPrice, avg_entry_price: cost } = curr;
    const stopLoss = cost * stopLossPerc;
    if (currPrice <= stopLoss) {
      return [...acc, curr];
    }
    conditionNotMet.push(curr);
    return acc;
  }, [])
  return { stopLossMet: conditionMet,remainingPositions: conditionNotMet }
}

export async function macdTargetMet(position, perc, context) {
  const stopLossPerc = perc || 0.95;
  const { symbol, current_price: currPrice, avg_entry_price: cost } = position;
  const bars = await getHistoricData(symbol, 1000, context);
  if (bars && Array.isArray(bars) && bars.length > 0) {
    const aggregatedClosingPrice = bars.map(bar => bar.c);
    const macdData = macd(aggregatedClosingPrice, 40, 60);
    const MACDNegative = !isMACDPositive(macdData.MACD, true);
    const stopLoss = cost * stopLossPerc;
    // 3 -- -- check if latest MACD reaches below 0 and 
    if (currPrice <= cost && MACDNegative) {
      return true;
    }
    const targetPrice = cost + ((cost - stopLoss) * 3);
    if (currPrice >= targetPrice && MACDNegative) {
      return true;
    }
    return false;
  }
  return false;
}

export function mapAsync(array, cb) { 
  return Promise.all(array.map(cb, {context: this.context}));
}

export async function filterAsync(array, cb) {
  const filterMap = await mapAsync(array, cb, { context: this.context });
  return array.filter((value, index) => filterMap[index]);
}
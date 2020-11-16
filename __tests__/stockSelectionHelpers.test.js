import { getDate, getTodaysBars, getHighestPrice, stopLossTargetMet } from '../src/lib/stockSelectionHelpers';

function dateFormater(dateObj) {
  const month = dateObj.getMonth() + 1;
  const date = dateObj.getDate();
  const year = String(dateObj.getFullYear()).slice(2, 4);
  return`${month}/${date}/${year}`;
}
 


describe('getDate', () => {
  test('it parses the correct Date string with date object input', () => {
    const currentDate = new Date();
    const dateResult = getDate(currentDate);
    const comparedDateStr = dateFormater(currentDate);
    
    expect(dateResult).toBe(comparedDateStr);
  });
  test('it parses the correct Date string with unix timestamp input', () => {
    const currentTimeStamp = Math.floor(new Date().getTime() / 1000);
    const dateResult = getDate(currentTimeStamp);
    const comparedDateStr = dateFormater(new Date(currentTimeStamp * 1e3));

    expect(dateResult).toBe(comparedDateStr);

  });
});

describe('getTodaysBars', () => {
  test('it gets todays stock bars from an array of stock bars', () => {
    const currentTimeStamp = Math.floor(new Date().getTime() / 1000);
    const testBarsArr = [{ t: currentTimeStamp }, { t: 1544129220 }];
    const result = getTodaysBars(testBarsArr);
    expect(result).toStrictEqual([{t: currentTimeStamp}]);
  });
});

describe('getHighestPrice', () => {
  test('it calculates the highest price from an array of stock bars', () => {
    
    const testBarsArr = [{
      t: 1544129220,
      o: 172.26,
      h: 172.3,
      l: 172.16,
      c: 172.18,
    }, {
      t: 1544129221,
      o: 172.26,
      h: 175,
      l: 172.16,
      c: 172.18,
    },
    {
      t: 1544129221,
      o: 172.26,
      h: 168,
      l: 172.16,
      c: 172.18,
    }];
    
    const result = getHighestPrice(testBarsArr);
    expect(result).toBe(175);
  });
});

describe('stopLossTargetMet', () => {
  test('it splits the array of positions to two. [stopLossMet]:when the current stock price  is equal to or less than the stoploss target and those that are not', () => {
    
    const positions = [
      {
        current_price: 100 * 0.95,
        avg_entry_price: 100,
        symbol: 'TEST'
      },
      {
        current_price: (100 * 0.95) + 2,
        avg_entry_price: 100,
        symbol: 'TEST'
      },
      {
        current_price: (100 * 0.95) - 1,
        avg_entry_price: 100,
        symbol: 'TEST'
      },
    ];
    
    const result = stopLossTargetMet(positions);
    const { stopLossMet, remainingPositions } = result;
    expect(stopLossMet.length).toBe(2);
    expect(stopLossMet[0].symbol).toBe('TEST');
    expect(remainingPositions.length).toBe(1);
  });
  test('the stopLossMet property in the result should be an empty array if all positions have current stock prices that are greater than the stoploss target', () => {
    
    const positions = [{
      current_price: (100 * 0.95) + 1,
      avg_entry_price: 100,
      symbol: 'TEST'
    }];
    
    const result = stopLossTargetMet(positions);
    const { stopLossMet } = result;
    expect(stopLossMet.length).toBe(0);
  });
});

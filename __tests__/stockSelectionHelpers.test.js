import { getDateISOString } from '../src/lib/stockSelectionHelpers';

describe('getDateISOString', () => {
  test('it parses the correct Date ISO string without any input', () => {
    const defaultResult = getDateISOString();
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const yesterdayISOString = date.toISOString();
    // checking only the dates match since seconds can differ
    expect(defaultResult).toContain(yesterdayISOString.split(':')[0]);
  });
  test('it parses the correct Date ISO stirng with the number and option inputs', () => { 
    const defaultResult 
  })
});

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

export function getDateString(dateObj) {
  try {
    if (!dateObj || !(dateObj instanceof Date && !isNaN(dateObj))) {
      throw new Error('a valid dateObj is required');
    }
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    const dayString = day < 10 ? `0${day}` : day;
    const monthString = month < 10 ? `0${month}` : month;
    return `${year}-${monthString}-${dayString}`;
  } catch (error) {
    console.error(`[getDateString]: ${error}`);
    throw error;
  }
}

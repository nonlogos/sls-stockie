import axios from 'axios';
import createError from 'http-errors';
import getParamsStoreMiddleware from '../lib/getParamsStoreMiddleware';
import commonMiddleware from '../lib/commonMiddlewares';

async function getMarketStatus(event, context) {
  try {
    const stage = process.env.STAGE;
    const {
      ALPACA_PAPER_API_KEY,
      ALPACA_PAPER_SECRET_KEY,
      ALPACA_PAPER_API_ENDPOINT,
      ALPACA_LIVE_API_ENDPOINT,
    } = process.env;
    const { ALPACA_LIVE_API_KEY, ALPACA_LIVE_SECRET_KEY } = context;
    const alpacaAPIKey = stage === 'dev' ? ALPACA_PAPER_API_KEY : ALPACA_LIVE_API_KEY;
    const alpacaSecretKey = stage === 'dev' ? ALPACA_PAPER_SECRET_KEY : ALPACA_LIVE_SECRET_KEY;

    const endpoint = stage === 'dev' ? ALPACA_PAPER_API_ENDPOINT : ALPACA_LIVE_API_ENDPOINT;
    const marketStatus = await axios({
      method: 'get',
      url: `${endpoint}/v2/clock`,
      headers: {
        'APCA-API-KEY-ID': alpacaAPIKey,
        'APCA-API-SECRET-KEY': alpacaSecretKey,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: marketStatus.data }),
    };
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
}

export const handler = getParamsStoreMiddleware(getMarketStatus).use(commonMiddleware);

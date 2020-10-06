import middy from '@middy/core';
import ssm from '@middy/ssm';

export default (handler, config) => {
  let params;
  if (config) {
    params = config;
  } else {
    const alpacaLiveApiPath = process.env.ALPACA_LIVE_API_PATH;
    const alpacaLiveSecretPath = process.env.ALPACA_LIVE_SECRET_PATH;
    const defaultParams = {
      cache: true,
      names: {
        ALPACA_LIVE_API_KEY: alpacaLiveApiPath,
        ALPACA_LIVE_SECRET_KEY: alpacaLiveSecretPath,
      },
      setToContext: true,
    };
    params = defaultParams;
  }

  return middy(handler).use(ssm(params));
};

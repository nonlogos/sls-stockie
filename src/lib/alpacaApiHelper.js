import axios from 'axios';

export default class Alpaca {
  constructor(context) { 
    this.ALPACA_LIVE_API_KEY = context.ALPACA_LIVE_API_KEY;
    this.ALPACA_LIVE_SECRET_KEY = context.ALPACA_LIVE_SECRET_KEY;
  }
  setupAlpacaEnv(isV1) {
    const stage = process.env.STAGE;
    const {
      ALPACA_PAPER_API_KEY,
      ALPACA_PAPER_SECRET_KEY,
      ALPACA_PAPER_API_ENDPOINT,
      ALPACA_LIVE_API_ENDPOINT,
      ALPACA_DATA_API_ENDPOINT,
    } = process.env;
    this.alpacaAPIKey = (stage === 'dev' && !isV1) ? ALPACA_PAPER_API_KEY : this.ALPACA_LIVE_API_KEY;
    this.alpacaSecretKey = (stage === 'dev' && !isV1) ? ALPACA_PAPER_SECRET_KEY : this.ALPACA_LIVE_SECRET_KEY;
    this.hostName = (stage === 'dev' && !isV1) ? ALPACA_PAPER_API_ENDPOINT : ALPACA_LIVE_API_ENDPOINT;
    this.v1HostName = ALPACA_DATA_API_ENDPOINT;
  }
  async getRequest(endpoint, version, params) { 
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('missing a valid endpoint argument');
      }
      this.setupAlpacaEnv((version === 'v1'));

      // alpaca market data apis still use v1 instead of v2
      // so default is v2 but if version of v1 is passed in
      // we will use v1 endpoint instead
      const hostEndpoint = (version && version === 'v1') ? `${this.v1HostName}/v1` : `${this.hostName}/v2`;
      const url = `${hostEndpoint}/${endpoint}`;
      const reqObj = this.setReqObj('get', url, null, params);

      const result = await axios(reqObj);

      return result.data ? result.data : result;
    } catch (error) {
      console.error('Alpaca.getRequest error: ', error);
      throw error;
     }
  }

  async postRequest(endpoint, data) {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('missing a valid endpoint argument');
      }

      this.setupAlpacaEnv();

      const url = `${this.hostName}/v2/${endpoint}`;
      const reqObj = this.setReqObj('post', url, data);
  
      const result = await axios(reqObj);
      
      return result.data ? result.data : result;

    } catch (error) {
      console.error('Alpaca.postRequest error: ', error);
      throw error;
     }
  }
  
  setReqObj(method, url, data, params) {
    try {
      if (!method || !url) {
        throw new Error('missing method or url');
      }
      if (!this.alpacaAPIKey || !this.alpacaSecretKey) { 
        throw new Error('missing alpacaApiKey or alpacaSecretKey');
      }
      let reqUrl = url;
      if (params && typeof params === 'object') {
        reqUrl = `${reqUrl}?`;
        Object.keys(params).forEach((key, index) => {
          if (index > 0) {
            reqUrl = `${reqUrl}&${key}=${params[key]}`
          } else { 
            reqUrl = `${reqUrl}${key}=${params[key]}`
          }
        })
      }
      return {
        method,
        url: reqUrl,
        headers: {
          'APCA-API-KEY-ID': this.alpacaAPIKey,
          'APCA-API-SECRET-KEY': this.alpacaSecretKey,
          },
        data
      }
    } catch (error) {
      console.error('Alpaca.setReqObj error: ', error);
      throw error;
     }
   }
 }
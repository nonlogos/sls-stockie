import axios from 'axios';

export default class Alpaca {
  constructor(context) { 
    this.ALPACA_LIVE_API_KEY = context.ALPACA_LIVE_API_KEY;
    this.ALPACA_LIVE_SECRET_KEY = context.ALPACA_LIVE_SECRET_KEY;
  }
  setupAlpacaEnv() {
    const stage = process.env.STAGE;
    const {
      ALPACA_PAPER_API_KEY,
      ALPACA_PAPER_SECRET_KEY,
      ALPACA_PAPER_API_ENDPOINT,
      ALPACA_LIVE_API_ENDPOINT,
    } = process.env;
    this.alpacaAPIKey = stage === 'dev' ? ALPACA_PAPER_API_KEY : this.ALPACA_LIVE_API_KEY;
    this.alpacaSecretKey = stage === 'dev' ? ALPACA_PAPER_SECRET_KEY : this.ALPACA_LIVE_SECRET_KEY;
    this.hostName = stage === 'dev' ? ALPACA_PAPER_API_ENDPOINT : ALPACA_LIVE_API_ENDPOINT;
  }
  async getRequest(endpoint) { 
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('missing a valid endpoint argument');
      }
      this.setupAlpacaEnv();

      if (!this.alpacaAPIKey || !this.alpacaSecretKey) { 
        throw new Error('missing alpacaApiKey or alpacaSecretKey');
      }
      const result = await axios({
      method: 'get',
      url: `${this.hostName}/v2/${endpoint}`,
      headers: {
        'APCA-API-KEY-ID': this.alpacaAPIKey,
        'APCA-API-SECRET-KEY': this.alpacaSecretKey,
      },
    });
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

      if (!this.alpacaAPIKey || !this.alpacaSecretKey) { 
        throw new Error('missing alpacaApiKey or alpacaSecretKey');
      }
  
      const result = await axios({
      method: 'post',
      url: `${this.hostName}/v2/${endpoint}`,
      headers: {
        'APCA-API-KEY-ID': this.alpacaAPIKey,
        'APCA-API-SECRET-KEY': this.alpacaSecretKey,
        },
      data
      });
      
      return result.data ? result.data : result;

    } catch (error) {
      console.error('Alpaca.postRequest error: ', error);
      throw error;
     }
   }
 }
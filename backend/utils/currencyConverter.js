const axios = require('axios');

const BASE_URL = 'https://api.exchangerate.host';

const getExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    const response = await axios.get(`${BASE_URL}/latest?base=${fromCurrency}&symbols=${toCurrency}`);
    if (response.data && response.data.rates && response.data.rates[toCurrency]) {
      return response.data.rates[toCurrency];
    } else {
      throw new Error('Invalid response from currency API');
    }
  } catch (error) {
    console.error(`Error fetching exchange rate from ${fromCurrency} to ${toCurrency}:`, error.message);
    throw new Error('Failed to fetch exchange rate');
  }
};

module.exports = { getExchangeRate };

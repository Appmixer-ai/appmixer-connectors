'use strict';

const axios = require('axios');

module.exports = async function(options) {
    try {
        const response = await axios(options);
        return response;
    } catch (error) {
        if (error.response) {
            throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
};

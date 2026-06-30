'use strict';

const axios = require('axios');

/**
 * Mock httpRequest function for testing
 */
module.exports = async function(options) {
    return axios(options);
};

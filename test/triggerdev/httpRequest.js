const axios = require('axios');

module.exports = async (options) => {
    const response = await axios({
        method: options.method || 'GET',
        url: options.url,
        headers: options.headers,
        data: options.data,
        params: options.params
    });

    return {
        data: response.data,
        status: response.status,
        headers: response.headers
    };
};

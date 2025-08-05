const axios = require('axios');

// Simple httpRequest wrapper for PDFco tests
module.exports = async function httpRequest(config) {
    try {
        const response = await axios(config);
        return {
            data: response.data,
            status: response.status,
            headers: response.headers
        };
    } catch (error) {
        if (error.response) {
            // Server responded with error status
            console.log('HTTP Request Error Details:');
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
            console.log('Request Config:', JSON.stringify({
                method: config.method,
                url: config.url,
                headers: config.headers,
                data: config.data
            }, null, 2));

            const newError = new Error(error.message);
            newError.response = {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            };
            throw newError;
        }
        throw error;
    }
};

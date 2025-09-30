const axios = require('axios');

// Simple httpRequest wrapper for tests
module.exports = async function httpRequest(config) {
    try {
        // Log the request for debugging
        if (config.method === 'PATCH' || config.method === 'POST') {
            console.log(`Making ${config.method} request to ${config.url}`);
            console.log('Headers:', JSON.stringify(config.headers, null, 2));
            console.log('Data:', JSON.stringify(config.data, null, 2));
        }

        const response = await axios(config);

        // Debug logging for POST/PATCH requests
        if (config.method === 'POST' || config.method === 'PATCH') {
            console.log(`API Response: ${config.method} ${config.url}`);
            console.log(`Status: ${response.status}`);
            console.log('Data:', response.data);
        }

        return {
            data: response.data,
            status: response.status,
            headers: response.headers
        };
    } catch (error) {
        if (error.response) {
            // Log error details for debugging
            console.log(`API Error: ${config.method} ${config.url}`);
            console.log(`Status: ${error.response.status}`);
            console.log('Error Data:', JSON.stringify(error.response.data, null, 2));

            // Server responded with error status
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


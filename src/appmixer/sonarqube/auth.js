'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your SonarQube account and generate a user token from your account security settings.'
            },
            serverUrl: {
                type: 'text',
                name: 'Server URL',
                tooltip: 'The base URL of your SonarQube server, e.g. https://sonarqube.example.com'
            }
        },

        requestProfileInfo(context) {
            const apiKey = context.apiKey;
            return {
                key: apiKey.substr(0, 3) + '...' + apiKey.substr(4)
            };
        },
        accountNameFromProfileInfo: 'key',

        validate: async (context) => {
            // SonarQube API: GET /api/authentication/validate
            const url = `${context.serverUrl.replace(/\/$/, '')}/api/authentication/validate`;
            const headers = {
                'Authorization': 'Basic ' + Buffer.from(context.apiKey + ':').toString('base64')
            };
            const response = await context.httpRequest({
                method: 'GET',
                url,
                headers
            });
            if (!response.data || response.data.valid !== true) {
                throw new Error('Authentication failed: Invalid API Key or Server URL.');
            }
            return true;
        }
    }
};

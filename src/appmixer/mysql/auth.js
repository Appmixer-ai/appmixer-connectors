'use strict';
const { connect } = require('./common');

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {

            tokenType: 'authentication-token',

            accountNameFromProfileInfo: 'database',

            auth: {
                dbUser: {
                    type: 'text',
                    name: 'User',
                    tooltip: 'Database User'
                },
                dbHost: {
                    type: 'text',
                    name: 'Host',
                    tooltip: 'Database Host'
                },
                dbPort: {
                    type: 'text',
                    name: 'Port',
                    tooltip: 'Database Port'
                },
                database: {
                    type: 'text',
                    name: 'Database',
                    tooltip: 'Name of your database'
                },
                dbPassword: {
                    type: 'password',
                    name: 'Password',
                    tooltip: 'Password'
                },
                useSsl: {
                    type: 'select',
                    name: 'Use SSL',
                    tooltip: 'Optional. Select <code>Yes</code> to encrypt the connection with SSL/TLS (required when the server or the user requires a secure transport). Without a CA certificate the server certificate is not verified. Default: No.',
                    placeholder: 'No',
                    options: [
                        { label: 'No', value: 'false' },
                        { label: 'Yes', value: 'true' }
                    ]
                },
                sslCa: {
                    type: 'textarea',
                    name: 'CA Certificate',
                    tooltip: 'Optional. Paste the PEM content of the CA certificate (<code>-----BEGIN CERTIFICATE-----</code> ...) that signed the server certificate. When filled, the connection uses SSL and the server certificate is verified against this CA.'
                }
            },

            validate: async context => {

                const conn = await connect(context);
                conn.end();
            }
        };
    }
};

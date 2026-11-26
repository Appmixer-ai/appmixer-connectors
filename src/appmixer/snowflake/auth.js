'use strict';
const { SnowflakeDB } = require('./common');

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {

            tokenType: 'authentication-token',

            accountNameFromProfileInfo: 'username',

            auth: {
                account: {
                    type: 'text',
                    name: 'Account',
                    tooltip: 'Your account identifier, the part of the account URL before <code>.snowflakecomputing.com</code>: <code>&lt;orgname&gt;-&lt;account_name&gt;</code> (for example <code>myorg-myaccount</code>) or the account locator with its region (for example <code>xy12345.eu-central-1</code>). In Snowsight: user menu → your account → <b>View account details</b>.',
                    required: true
                },
                username: {
                    type: 'text',
                    name: 'Username',
                    tooltip: 'The login name of the Snowflake user.',
                    required: true
                },
                password: {
                    type: 'password',
                    name: 'Password or Token',
                    tooltip: 'A programmatic access token of the user (recommended), or its password. Snowflake no longer accepts a password alone for most users. Leave empty when you use a private key.'
                },
                privateKey: {
                    type: 'textarea',
                    name: 'Private Key',
                    tooltip: 'Optional. For key-pair authentication, paste the PEM private key (<code>-----BEGIN PRIVATE KEY-----</code> ...) whose public key is set on the user (<code>ALTER USER ... SET RSA_PUBLIC_KEY</code>). When filled, it is used instead of the password.'
                },
                privateKeyPassphrase: {
                    type: 'password',
                    name: 'Private Key Passphrase',
                    tooltip: 'Optional. The passphrase of an encrypted private key (<code>-----BEGIN ENCRYPTED PRIVATE KEY-----</code>).'
                },
                database: {
                    type: 'text',
                    name: 'Database',
                    tooltip: 'Name of the database the components work in.',
                    required: true
                },
                warehouse: {
                    type: 'text',
                    name: 'Warehouse',
                    tooltip: 'Name of the warehouse that runs the queries, for example <code>COMPUTE_WH</code>.',
                    required: true
                }
            },

            validate: async context => {

                if (!context.password && !(context.privateKey && context.privateKey.trim())) {
                    throw new Error('Enter a programmatic access token or password, or a private key.');
                }
                const snowflake = new SnowflakeDB();
                const connection = await snowflake.getConnection(context);
                await new Promise(resolve => connection.destroy(() => resolve()));
                return true;
            }
        };
    }
};

'use strict';

const lib = require('../../lib');

// Schema of a single user item
const schema = {
    'id': {
        'type': 'string',
        'title': 'User ID'
    },
    'object': {
        'type': 'string',
        'title': 'Object'
    },
    'username': {
        'type': 'string',
        'title': 'Username'
    },
    'first_name': {
        'type': 'string',
        'title': 'First Name'
    },
    'last_name': {
        'type': 'string',
        'title': 'Last Name'
    },
    'image_url': {
        'type': 'string',
        'title': 'Image URL'
    },
    'has_image': {
        'type': 'boolean',
        'title': 'Has Image'
    },
    'primary_email_address_id': {
        'type': 'string',
        'title': 'Primary Email Address ID'
    },
    'primary_phone_number_id': {
        'type': 'string',
        'title': 'Primary Phone Number ID'
    },
    'primary_web3_wallet_id': {
        'type': 'string',
        'title': 'Primary Web3 Wallet ID'
    },
    'password_enabled': {
        'type': 'boolean',
        'title': 'Password Enabled'
    },
    'two_factor_enabled': {
        'type': 'boolean',
        'title': 'Two Factor Enabled'
    },
    'totp_enabled': {
        'type': 'boolean',
        'title': 'TOTP Enabled'
    },
    'backup_code_enabled': {
        'type': 'boolean',
        'title': 'Backup Code Enabled'
    },
    'email_addresses': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Email Addresses.ID' },
                'email_address': { 'type': 'string', 'title': 'Email Addresses.Email Address' },
                'verification': { 'type': 'object', 'title': 'Email Addresses.Verification' }
            }
        },
        'title': 'Email Addresses'
    },
    'phone_numbers': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Phone Numbers.ID' },
                'phone_number': { 'type': 'string', 'title': 'Phone Numbers.Phone Number' },
                'verification': { 'type': 'object', 'title': 'Phone Numbers.Verification' }
            }
        },
        'title': 'Phone Numbers'
    },
    'web3_wallets': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Web3 Wallets.ID' },
                'web3_wallet': { 'type': 'string', 'title': 'Web3 Wallets.Web3 Wallet' },
                'verification': { 'type': 'object', 'title': 'Web3 Wallets.Verification' }
            }
        },
        'title': 'Web3 Wallets'
    },
    'external_accounts': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'External Accounts.ID' },
                'provider': { 'type': 'string', 'title': 'External Accounts.Provider' },
                'identification_id': { 'type': 'string', 'title': 'External Accounts.Identification ID' }
            }
        },
        'title': 'External Accounts'
    },
    'public_metadata': {
        'type': 'object',
        'title': 'Public Metadata'
    },
    'private_metadata': {
        'type': 'object',
        'title': 'Private Metadata'
    },
    'unsafe_metadata': {
        'type': 'object',
        'title': 'Unsafe Metadata'
    },
    'created_at': {
        'type': 'number',
        'title': 'Created At'
    },
    'updated_at': {
        'type': 'number',
        'title': 'Updated At'
    },
    'last_sign_in_at': {
        'type': 'number',
        'title': 'Last Sign In At'
    },
    'banned': {
        'type': 'boolean',
        'title': 'Banned'
    },
    'locked': {
        'type': 'boolean',
        'title': 'Locked'
    },
    'lockout_expires_in_seconds': {
        'type': 'number',
        'title': 'Lockout Expires In Seconds'
    },
    'verification_attempts_remaining': {
        'type': 'number',
        'title': 'Verification Attempts Remaining'
    }
};

module.exports = {

    async receive(context) {
        const {
            emailAddress,
            username,
            phoneNumber,
            outputType = 'array'
        } = context.messages.in.content;

        // Generate output port schema dynamically based on the outputType
        // This is triggered by definition from the component.json, outPorts.out.source.url
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Users' });
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (emailAddress) queryParams.append('email_address_query', emailAddress);
        if (username) queryParams.append('username_query', username);
        if (phoneNumber) queryParams.append('phone_number_query', phoneNumber);

        // Make API request
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Extract users array from response
        const users = data && Array.isArray(data) ? data : [];

        if (users.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Use lib function to handle different output types
        return lib.sendArrayOutput({ context, records: users, outputType });
    }
};

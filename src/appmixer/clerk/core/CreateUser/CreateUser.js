'use strict';

module.exports = {
    async receive(context) {

        const {
            externalId,
            firstName,
            lastName,
            emailAddresses,
            phoneNumbers,
            web3Wallets,
            username,
            password,
            passwordDigest,
            deleteSelfEnabled
        } = context.messages.in.content;

        // Helper function to convert textarea input to array
        const textareaToArray = (value) => {
            if (!value) return undefined;
            if (Array.isArray(value)) return value;
            return value.split(/\r?\n|,/).map(item => item.trim()).filter(item => item.length > 0);
        };

        const body = {};

        // Required/Optional string fields
        if (externalId) body.external_id = externalId;
        if (firstName) body.first_name = firstName;
        if (lastName) body.last_name = lastName;
        if (username) body.username = username;
        if (password) body.password = password;
        if (passwordDigest) body.password_digest = passwordDigest;

        // Array fields - convert textarea input to arrays
        const emailArray = textareaToArray(emailAddresses);
        if (emailArray && emailArray.length > 0) {
            body.email_address = emailArray;
        }

        const phoneArray = textareaToArray(phoneNumbers);
        if (phoneArray && phoneArray.length > 0) {
            body.phone_number = phoneArray;
        }

        const walletArray = textareaToArray(web3Wallets);
        if (walletArray && walletArray.length > 0) {
            body.web3_wallet = walletArray;
        }

        // Boolean fields
        if (deleteSelfEnabled !== undefined) body.delete_self_enabled = deleteSelfEnabled;

        // Validation: At least one identifier must be provided
        if (!body.email_address && !body.phone_number && !body.username && !body.external_id) {
            throw new context.CancelError('At least one identifier must be provided: email address, phone number, username, or external ID');
        }

        // https://clerk.com/docs/references/backend/overview#users
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.clerk.com/v1/users',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};

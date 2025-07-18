
'use strict';

module.exports = {
    async receive(context) {
        const {
            emailAddress,
            phoneNumber,
            username,
            password,
            firstName,
            lastName,
            publicMetadata,
            privateMetadata,
            skipPasswordChecks
        } = context.messages.in.content;

        // Validate required fields
        if (!emailAddress) {
            throw new Error('Email address is required');
        }

        // Prepare the request body
        const body = {};
        // Email addresses (array of strings)
        body.email_address = emailAddress ? [emailAddress] : undefined;
        // Phone numbers (array of strings)
        if (phoneNumber) {
            body.phone_number = [phoneNumber];
        }
        // Other properties
        if (username) body.username = username;
        if (password) body.password = password;
        if (firstName) body.first_name = firstName;
        if (lastName) body.last_name = lastName;
        if (publicMetadata) body.public_metadata = publicMetadata;
        if (privateMetadata) body.private_metadata = privateMetadata;
        if (skipPasswordChecks) body.skip_password_checks = skipPasswordChecks;

        // Log the request for debugging
        console.log('Request body:', JSON.stringify(body, null, 2));

        // Make API request
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.clerk.com/v1/users',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        // Return the created user
        return context.sendJson(data, 'out');
    }
};

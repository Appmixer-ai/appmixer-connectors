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
        } = context.messages.in;
        
        // Prepare the request body
        const body = {};
        
        // Email addresses (array of objects with email_address property)
        if (emailAddress) {
            body.email_addresses = [{ email_address: emailAddress }];
        }
        
        // Phone numbers (array of objects with phone_number property)
        if (phoneNumber) {
            body.phone_numbers = [{ phone_number: phoneNumber }];
        }
        
        // Other properties
        if (username) body.username = username;
        if (password) body.password = password;
        if (firstName) body.first_name = firstName;
        if (lastName) body.last_name = lastName;
        if (publicMetadata) body.public_metadata = publicMetadata;
        if (privateMetadata) body.private_metadata = privateMetadata;
        if (skipPasswordChecks) body.skip_password_checks = skipPasswordChecks;
        
        // Make API request
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.clerk.com/v1/users',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body,
            json: true
        });
        
        // Return the created user
        return context.sendJson(response, 'out');
    }
};

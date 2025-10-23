
'use strict';

module.exports = {
    async receive(context) {

        const {
            firstName,
            lastName,
            emailValue,
            emailType,
            phone,
            photoUrl,
            photoType,
            jobTitle,
            location,
            background,
            age,
            gender
        } = context.messages.in.content;

        // Validate required fields
        if (!firstName || !firstName.trim()) {
            throw new context.CancelError('First Name is required!');
        }

        if (!lastName || !lastName.trim()) {
            throw new context.CancelError('Last Name is required!');
        }

        if (!emailValue || !emailValue.trim()) {
            throw new context.CancelError('Email Address is required!');
        }

        // Build the request body with all available customer data
        const requestBody = {};

        // Add basic information if provided
        if (firstName && firstName.trim()) {
            requestBody.firstName = firstName.trim();
        }
        if (lastName && lastName.trim()) {
            requestBody.lastName = lastName.trim();
        }

        // Add email if provided
        if (emailValue && emailValue.trim()) {
            requestBody.emails = [{
                type: emailType || 'work',
                value: emailValue.trim()
            }];
        }

        // Add phone if provided
        if (phone && phone.trim()) {
            requestBody.phone = phone.trim();
        }

        // Add photo information if provided
        if (photoUrl && photoUrl.trim()) {
            requestBody.photoUrl = photoUrl.trim();
        }
        if (photoType && photoType.trim()) {
            requestBody.photoType = photoType.trim();
        }

        // Add professional information if provided
        if (jobTitle && jobTitle.trim()) {
            requestBody.jobTitle = jobTitle.trim();
        }
        if (location && location.trim()) {
            requestBody.location = location.trim();
        }
        if (background && background.trim()) {
            requestBody.background = background.trim();
        }

        // Add demographic information if provided
        if (age && age.trim()) {
            requestBody.age = age.trim();
        }
        if (gender && gender.trim()) {
            requestBody.gender = gender.trim();
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/customers/create/
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.helpscout.net/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        // HelpScout Create Customer API returns 201 with empty body
        // Customer information is in response headers
        const result = {
            'Resource-ID': response.headers['resource-id'] || response.headers['Resource-ID'],
            'Location': response.headers['location'] || response.headers['Location']
        };

        return context.sendJson(result, 'out');
    }
};

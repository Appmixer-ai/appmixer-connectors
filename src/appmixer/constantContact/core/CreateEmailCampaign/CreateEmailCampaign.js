'use strict';

module.exports = {
    async receive(context) {
        const {
            name,
            subject,
            fromName,
            fromEmail,
            replyToEmail,
            htmlContent,
            preheader,
            addressLine1,
            addressLine2,
            addressLine3,
            addressOptional,
            city,
            stateCode,
            stateNonUsName,
            postalCode,
            countryCode,
            organizationName
        } = context.messages.in.content;

        // Validate required inputs
        if (!name) {
            throw new context.CancelError('Campaign Name is required!');
        }
        if (!subject) {
            throw new context.CancelError('Subject Line is required!');
        }
        if (!fromName) {
            throw new context.CancelError('From Name is required!');
        }
        if (!fromEmail) {
            throw new context.CancelError('From Email is required!');
        }
        if (!replyToEmail) {
            throw new context.CancelError('Reply To Email is required!');
        }
        if (!htmlContent) {
            throw new context.CancelError('HTML Content is required!');
        }

        // Build the email campaign activity object
        const emailCampaignActivity = {
            format_type: 5, // Required: custom code format
            from_name: fromName,
            from_email: fromEmail,
            reply_to_email: replyToEmail,
            subject: subject,
            html_content: htmlContent
        };

        // Add optional preheader
        if (preheader) {
            emailCampaignActivity.preheader = preheader;
        }

        // Build physical address object if any address fields are provided
        if (addressLine1 || city || stateCode || postalCode || countryCode || organizationName) {
            const physicalAddress = {};

            if (addressLine1) physicalAddress.address_line1 = addressLine1;
            if (addressLine2) physicalAddress.address_line2 = addressLine2;
            if (addressLine3) physicalAddress.address_line3 = addressLine3;
            if (addressOptional) physicalAddress.address_optional = addressOptional;
            if (city) physicalAddress.city = city;
            if (stateCode) physicalAddress.state_code = stateCode;
            if (stateNonUsName) physicalAddress.state_non_us_name = stateNonUsName;
            if (postalCode) physicalAddress.postal_code = postalCode;
            if (countryCode) physicalAddress.country_code = countryCode;
            if (organizationName) physicalAddress.organization_name = organizationName;

            emailCampaignActivity.physical_address_in_footer = physicalAddress;
        }

        // Build the request body according to Constant Contact API v3
        const requestBody = {
            name: name,
            email_campaign_activities: [emailCampaignActivity]
        };

        // Create the email campaign
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.cc.email/v3/emails',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};

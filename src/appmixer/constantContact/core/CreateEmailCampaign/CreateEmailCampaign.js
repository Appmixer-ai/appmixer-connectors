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
            textContent,
            listIds
        } = context.messages.in.content;

        // Validate required inputs
        if (!name) {
            throw new context.CancelError('Campaign Name is required!');
        }
        if (!subject) {
            throw new context.CancelError('Subject Line is required!');
        }
        if (!fromEmail) {
            throw new context.CancelError('From Email is required!');
        }
        if (!htmlContent) {
            throw new context.CancelError('HTML Content is required!');
        }
        if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
            throw new context.CancelError('Target List IDs is required!');
        }

        // Build the request body according to Constant Contact API
        const requestBody = {
            name,
            subject,
            from: {
                email: fromEmail
            },
            primary_content: {
                html: htmlContent
            },
            contact_list_ids: listIds
        };

        // Add optional fields if provided
        if (fromName) {
            requestBody.from.name = fromName;
        }

        if (replyToEmail) {
            requestBody.reply_to = replyToEmail;
        }

        if (textContent) {
            requestBody.primary_content.plain_text = textContent;
        }

        // Create the campaign
        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Email_Campaigns/createEmailCampaign
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.cc.email/v3/email_campaigns',
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

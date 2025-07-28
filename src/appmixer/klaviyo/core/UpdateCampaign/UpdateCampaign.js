module.exports = {

    async receive(context) {

        const {
            campaignId,
            name,
            subject,
            fromEmail,
            fromName,
            replyToEmail,
            isSkippable
        } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        const updateData = {
            data: {
                type: 'campaign',
                id: campaignId,
                attributes: {}
            }
        };

        // Only include fields that are provided
        if (name) updateData.data.attributes.name = name;
        if (subject) updateData.data.attributes.subject = subject;
        if (fromEmail) updateData.data.attributes.from_email = fromEmail;
        if (fromName) updateData.data.attributes.from_name = fromName;
        if (replyToEmail) updateData.data.attributes.reply_to_email = replyToEmail;
        if (isSkippable !== undefined) updateData.data.attributes.is_skippable = isSkippable;

        await context.httpRequest({
            method: 'PATCH',
            url: `https://a.klaviyo.com/api/campaigns/${campaignId}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Revision': '2025-07-15'
            },
            data: updateData
        });

        return context.sendJson({}, 'out');
    }
};

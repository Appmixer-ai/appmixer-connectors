'use strict';

module.exports = {
    async receive(context) {
        const {
            campaignId,
            name,
            languageCode,
            isDefault,
            confirmationSubject,
            confirmationFromName,
            confirmationFromEmail,
            confirmationReplyToEmail,
            confirmationRedirectUrl
        } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        const body = {};

        if (name !== undefined) {
            body.name = name;
        }

        if (languageCode !== undefined) {
            body.languageCode = languageCode;
        }

        if (isDefault !== undefined) {
            body.isDefault = isDefault;
        }

        // Build confirmation object if any confirmation fields are provided
        if (confirmationSubject !== undefined || confirmationFromName !== undefined ||
            confirmationFromEmail !== undefined || confirmationReplyToEmail !== undefined ||
            confirmationRedirectUrl !== undefined) {
            body.confirmation = {};

            if (confirmationSubject !== undefined) {
                body.confirmation.subscriptionConfirmationSubject = confirmationSubject;
            }
            if (confirmationFromName !== undefined || confirmationFromEmail !== undefined) {
                body.confirmation.fromField = {};
                if (confirmationFromName !== undefined) {
                    body.confirmation.fromField.fromFieldName = confirmationFromName;
                }
                if (confirmationFromEmail !== undefined) {
                    body.confirmation.fromField.fromFieldId = confirmationFromEmail;
                }
            }
            if (confirmationReplyToEmail !== undefined) {
                body.confirmation.replyTo = {
                    fromFieldId: confirmationReplyToEmail
                };
            }
            if (confirmationRedirectUrl !== undefined) {
                body.confirmation.redirectUrl = confirmationRedirectUrl;
            }
        }

        await context.httpRequest({
            method: 'POST',
            url: `https://api.getresponse.com/v3/campaigns/${campaignId}`,
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: body
        });

        return context.sendJson(response.data, 'out');
    }
};

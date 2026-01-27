'use strict';

module.exports = {
    async receive(context) {
        const {
            name,
            languageCode,
            isDefault,
            confirmationSubject,
            confirmationFromName,
            confirmationFromEmail,
            confirmationReplyToEmail,
            confirmationRedirectUrl
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Campaign Name is required!');
        }

        const body = {
            name
        };

        if (languageCode) {
            body.languageCode = languageCode;
        }

        if (isDefault !== undefined) {
            body.isDefault = isDefault;
        }

        // Build confirmation object if any confirmation fields are provided
        if (confirmationSubject || confirmationFromName || confirmationFromEmail) {
            body.confirmation = {
                fromField: {},
                subscriptionConfirmationSubject: confirmationSubject || 'Please confirm your subscription'
            };

            if (confirmationFromName) {
                body.confirmation.fromField.fromFieldName = confirmationFromName;
            }
            if (confirmationFromEmail) {
                body.confirmation.fromField.fromFieldId = confirmationFromEmail;
            }
            if (confirmationReplyToEmail) {
                body.confirmation.replyTo = {
                    fromFieldId: confirmationReplyToEmail
                };
            }
            if (confirmationRedirectUrl) {
                body.confirmation.redirectUrl = confirmationRedirectUrl;
            }
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.getresponse.com/v3/campaigns',
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

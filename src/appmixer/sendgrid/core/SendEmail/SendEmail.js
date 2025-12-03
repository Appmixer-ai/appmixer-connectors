'use strict';

module.exports = {
    async receive(context) {
        const {
            toEmail,
            toName,
            ccEmail,
            ccName,
            bccEmail,
            bccName,
            personalizationSubject,
            personalizationHeaders,
            personalizationCustomArgs,
            personalizationDynamicTemplateData,
            personalizationSendAt,
            fromEmail,
            fromName,
            replyToEmail,
            replyToName,
            subject,
            contentType,
            contentValue,
            attachmentContent,
            attachmentType,
            attachmentFilename,
            attachmentDisposition,
            attachmentContentId,
            templateId,
            categories,
            customArgs,
            sendAt,
            batchId,
            sandboxModeEnable,
            clickTrackingEnable,
            clickTrackingEnableText,
            openTrackingEnable,
            openTrackingSubstitutionTag,
            subscriptionTrackingEnable
        } = context.messages.in.content;

        // Validate required fields
        if (!fromEmail) {
            throw new context.CancelError('From Email is required!');
        }
        if (!toEmail) {
            throw new context.CancelError('To Email is required!');
        }

        // Build personalizations array
        const personalizations = [{
            to: [{ email: toEmail }]
        }];

        // Add optional personalization fields
        if (toName) {
            personalizations[0].to[0].name = toName;
        }

        if (ccEmail) {
            personalizations[0].cc = [{ email: ccEmail }];
            if (ccName) {
                personalizations[0].cc[0].name = ccName;
            }
        }

        if (bccEmail) {
            personalizations[0].bcc = [{ email: bccEmail }];
            if (bccName) {
                personalizations[0].bcc[0].name = bccName;
            }
        }

        if (personalizationSubject) {
            personalizations[0].subject = personalizationSubject;
        }

        if (personalizationHeaders) {
            personalizations[0].headers = personalizationHeaders;
        }

        if (personalizationCustomArgs) {
            personalizations[0].custom_args = personalizationCustomArgs;
        }

        if (personalizationDynamicTemplateData) {
            personalizations[0].dynamic_template_data = personalizationDynamicTemplateData;
        }

        if (personalizationSendAt) {
            personalizations[0].send_at = personalizationSendAt;
        }

        // Build email payload
        const payload = {
            personalizations,
            from: { email: fromEmail }
        };

        if (fromName) {
            payload.from.name = fromName;
        }

        if (replyToEmail) {
            payload.reply_to = { email: replyToEmail };
            if (replyToName) {
                payload.reply_to.name = replyToName;
            }
        }

        if (subject) {
            payload.subject = subject;
        }

        if (contentType && contentValue) {
            payload.content = [{ type: contentType, value: contentValue }];
        }

        if (attachmentContent && attachmentFilename) {
            payload.attachments = [{
                content: attachmentContent,
                type: attachmentType || 'application/octet-stream',
                filename: attachmentFilename
            }];
            if (attachmentDisposition) {
                payload.attachments[0].disposition = attachmentDisposition;
            }
            if (attachmentContentId) {
                payload.attachments[0].content_id = attachmentContentId;
            }
        }

        if (templateId) {
            payload.template_id = templateId;
        }

        if (categories && Array.isArray(categories) && categories.length > 0) {
            payload.categories = categories;
        }

        if (customArgs) {
            payload.custom_args = customArgs;
        }

        if (sendAt) {
            payload.send_at = sendAt;
        }

        if (batchId) {
            payload.batch_id = batchId;
        }

        // Build mail settings
        const mailSettings = {};
        if (sandboxModeEnable !== undefined) {
            mailSettings.sandbox_mode = { enable: sandboxModeEnable };
        }
        if (Object.keys(mailSettings).length > 0) {
            payload.mail_settings = mailSettings;
        }

        // Build tracking settings
        const trackingSettings = {};
        if (clickTrackingEnable !== undefined) {
            trackingSettings.click_tracking = { enable: clickTrackingEnable };
            if (clickTrackingEnableText !== undefined) {
                trackingSettings.click_tracking.enable_text = clickTrackingEnableText;
            }
        }
        if (openTrackingEnable !== undefined) {
            trackingSettings.open_tracking = { enable: openTrackingEnable };
            if (openTrackingSubstitutionTag) {
                trackingSettings.open_tracking.substitution_tag = openTrackingSubstitutionTag;
            }
        }
        if (subscriptionTrackingEnable !== undefined) {
            trackingSettings.subscription_tracking = { enable: subscriptionTrackingEnable };
        }
        if (Object.keys(trackingSettings).length > 0) {
            payload.tracking_settings = trackingSettings;
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send
        await context.httpRequest({
            method: 'POST',
            url: 'https://api.sendgrid.com/v3/mail/send',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson({}, 'out');
    }
};

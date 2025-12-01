'use strict';

module.exports = {
    async receive(context) {
        const {
            to,
            subject,
            htmlContent,
            textContent,
            senderEmail,
            senderName,
            replyToEmail,
            replyToName,
            cc,
            bcc,
            params,
            templateId } = context.messages.in.content;
        if (!senderEmail) {
            throw new context.CancelError('Sender Email is required');
        }

        if (!subject) {
            throw new context.CancelError('Subject is required');
        }

        if (!replyToEmail) {
            throw new context.CancelError('Reply-To Email is required');
        }

        // Convert templateId to integer if provided
        let processedTemplateId;
        if (templateId !== undefined && templateId !== null && templateId !== '') {
            const templateIdInt = parseInt(templateId, 10);
            if (isNaN(templateIdInt)) {
                throw new context.CancelError('Template ID must be a valid integer');
            }
            processedTemplateId = templateIdInt;
        }

        // Validate that either templateId or content is provided
        if (!processedTemplateId && !htmlContent && !textContent) {
            throw new context.CancelError('Either Template ID or HTML Content or Text Content must be provided');
        }

        const toArr = to.ADD.map((recipient) => {
            return {
                name: recipient.name,
                email: recipient.email
            };
        });

        const ccArr = cc?.ADD.map((recipient) => {
            return {
                name: recipient.name,
                email: recipient.email
            };
        });

        const bccArr = bcc?.ADD.map((recipient) => {
            return {
                name: recipient.name,
                email: recipient.email
            };
        });

        // Build params object from expression
        const paramsObj = {};
        if (params?.ADD?.length) {
            for (const row of params.ADD) {
                const key = String(row.key || '').trim();
                const type = row.valueType;

                if (!key) {
                    throw new context.CancelError('Each Template Param must have a non empty Key.');
                }
                if (!type) {
                    throw new context.CancelError(`Template Param "${key}" must have a Value Type.`);
                }

                let value;
                if (type === 'text') {
                    value = row.valueText ?? '';
                } else if (type === 'number') {
                    value = Number(row.valueNumber);
                    if (Number.isNaN(value)) {
                        throw new context.CancelError(`Template Param "${key}" has an invalid Number Value.`);
                    }
                } else if (type === 'boolean') {
                    value = Boolean(row.valueBoolean);
                } else if (type === 'json') {
                    const raw = row.valueJson;
                    if (raw == null) {
                        throw new context.CancelError(`Template Param "${key}" JSON Value is empty.`);
                    }

                    // If it's already a non-string value, use it directly
                    if (typeof raw !== 'string') {
                        value = raw;
                    } else {
                        // Parse JSON string
                        const rawStr = raw.trim();
                        if (!rawStr) {
                            throw new context.CancelError(`Template Param "${key}" JSON Value is empty.`);
                        }
                        try {
                            value = JSON.parse(rawStr);
                        } catch (e) {
                            throw new context.CancelError(`Template Param "${key}" JSON Value is not valid JSON.`);
                        }
                    }
                } else {
                    throw new context.CancelError(`Unsupported Value Type "${type}" for Template Param "${key}".`);
                }

                paramsObj[key] = value;
            }
        }

        // https://developers.brevo.com/reference/sendtransacemail
        const options = {
            method: 'POST',
            url: 'https://api.brevo.com/v3/smtp/email',
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                to: toArr,
                cc: ccArr,
                bcc: bccArr,
                htmlContent,
                replyTo: {
                    name: replyToName,
                    email: replyToEmail
                },
                sender: {
                    name: senderName,
                    email: senderEmail
                },
                subject,
                textContent,
                ...(processedTemplateId !== undefined ? { templateId: processedTemplateId } : {}),
                // include params only when present
                ...(Object.keys(paramsObj).length ? { params: paramsObj } : {})
            }
        };
        const { data } = await context.httpRequest(options);

        return context.sendJson(data, 'out');
    }
};

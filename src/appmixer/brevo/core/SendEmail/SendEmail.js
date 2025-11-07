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
        if (params && Array.isArray(params.ADD)) {
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
                    const n = Number(row.valueNumber);
                    if (Number.isNaN(n)) {
                        throw new context.CancelError(`Template Param "${key}" has an invalid Number Value.`);
                    }
                    value = n;
                } else if (type === 'boolean') {
                    value = Boolean(row.valueBoolean);
                } else if (type === 'json') {
                    const raw = row.valueJson;
                    if (raw == null || String(raw).trim() === '') {
                        throw new context.CancelError(`Template Param "${key}" JSON Value is empty.`);
                    }
                    try {
                        value = JSON.parse(raw);
                    } catch (e) {
                        throw new context.CancelError(`Template Param "${key}" JSON Value is not valid JSON.`);
                    }
                } else {
                    throw new context.CancelError(`Unsupported Value Type "${type}" for Template Param "${key}".`);
                }

                // Last write wins if duplicate keys appear
                paramsObj[key] = value;
            }
        }

        // https://developers.brevo.com/reference/sendtransacemail

        const { data } = await context.httpRequest({
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
        });

        return context.sendJson(data, 'out');
    }
};

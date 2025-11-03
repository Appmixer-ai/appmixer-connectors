
'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            firstName,
            lastName,
            background,
            addEmailValue,
            addEmailType,
            removeEmailId,
            replaceEmailId,
            replaceEmailValue,
            replaceEmailType
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Customer ID is required!');
        }

        const patches = [];

        const toStringSafe = v => (v === null || v === undefined) ? '' : String(v);
        const toNumberSafe = (v, name) => {
            const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : Number(v));
            if (!Number.isFinite(n)) throw new context.CancelError(`${name} must be a number`);
            return n;
        };

        if (firstName !== undefined) {
            patches.push({ op: 'replace', path: '/firstName', value: toStringSafe(firstName) });
        }

        if (lastName !== undefined) {
            patches.push({ op: 'replace', path: '/lastName', value: toStringSafe(lastName) });
        }

        if (background !== undefined) {
            patches.push({ op: 'replace', path: '/background', value: toStringSafe(background) });
        }

        // Add an email entry
        if (addEmailValue !== undefined) {
            const value = toStringSafe(addEmailValue);
            const type = toStringSafe(addEmailType) || 'other';
            patches.push({ op: 'add', path: '/emails', value: { type, value } });
        }

        // Remove an email by id
        if (removeEmailId !== undefined) {
            const n = toNumberSafe(removeEmailId, 'removeEmailId');
            patches.push({ op: 'remove', path: `/emails/${n}` });
        }

        // Replace email value/type for particular email id
        if (replaceEmailId !== undefined) {
            const n = toNumberSafe(replaceEmailId, 'replaceEmailId');
            if (replaceEmailValue !== undefined) {
                patches.push({ op: 'replace', path: `/emails/${n}/value`, value: toStringSafe(replaceEmailValue) });
            }
            if (replaceEmailType !== undefined) {
                patches.push({ op: 'replace', path: `/emails/${n}/type`, value: toStringSafe(replaceEmailType) });
            }
        }

        if (patches.length === 0) {
            throw new context.CancelError('At least one field must be provided to update!');
        }

        // Send JSON Patch array
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.helpscout.net/v2/customers/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: patches,
            validateStatus: status => (status >= 200 && status < 300) || status === 204
        });

        if (response.status === 204) {
            return context.sendJson({}, 'out');
        }

        return context.sendJson(response.data || {}, 'out');
    }
};

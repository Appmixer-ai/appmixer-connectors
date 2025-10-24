
'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            subject,
            primaryCustomerId,
            draft,
            mailboxId,
            status,
            assignToId,
            unassign
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Conversation ID is required!');
        }

        const patches = [];

        // Helper coercers (we convert values to the expected types rather than strict-validate)
        const toStringSafe = v => (v === null || v === undefined) ? '' : String(v);
        const toNumberSafe = (v, name) => {
            // Accept numbers or numeric strings; coerce using Number() and guard against NaN
            const n = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v) : Number(v));
            if (!Number.isFinite(n)) throw new context.CancelError(`${name} must be a number`);
            return n;
        };

        // Build validated patches according to api-documentation.md
        if (subject !== undefined) {
            // Coerce subject to string
            patches.push({ op: 'replace', path: '/subject', value: toStringSafe(subject) });
        }

        if (primaryCustomerId !== undefined) {
            const n = toNumberSafe(primaryCustomerId, 'primaryCustomerId');
            patches.push({ op: 'replace', path: '/primaryCustomer.id', value: n });
        }

        if (draft !== undefined) {
            // Draft expected to be boolean per your note; coerce defensively
            patches.push({ op: 'replace', path: '/draft', value: !!draft });
        }

        if (mailboxId !== undefined) {
            const n = toNumberSafe(mailboxId, 'mailboxId');
            // API describes mailbox move as 'move'. We'll follow that and provide the mailbox id as value.
            patches.push({ op: 'move', path: '/mailboxId', value: n });
        }

        if (status !== undefined) {
            // Coerce to string and validate against allowed enum from component.json
            const s = toStringSafe(status);
            const allowed = ['active', 'pending', 'closed'];
            if (!allowed.includes(s)) {
                throw new context.CancelError(`status must be one of: ${allowed.join(', ')}`);
            }
            patches.push({ op: 'replace', path: '/status', value: s });
        }

        // assign or unassign behavior for /assignTo expects a numeric id value per API docs
        if (unassign === true) {
            // When unassigning we require the assignee id to be provided so the server
            // knows which assignee to remove (API expects a Number for the remove op).
            if (assignToId === undefined) {
                throw new context.CancelError('assignToId is required when unassign is true');
            }
            const n = toNumberSafe(assignToId, 'assignToId');
            patches.push({ op: 'remove', path: '/assignTo', value: n });
        } else if (assignToId !== undefined) {
            const n = toNumberSafe(assignToId, 'assignToId');
            // Replace owner with numeric id per docs
            patches.push({ op: 'replace', path: '/assignTo', value: n });
        }

        // tags and customFields are not part of the finalized component.json — removed.

        if (patches.length === 0) {
            throw new context.CancelError('At least one updatable field must be provided.');
        }

        // Send JSON Patch array
        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/update/

        // Help Scout expects a single JSON Patch object for the conversations
        // endpoint (not an array). If multiple fields are provided, ask the
        // caller to send them in separate requests to avoid ambiguous parsing.
        if (patches.length !== 1) {
            throw new context.CancelError('The Help Scout /conversations endpoint accepts a single JSON Patch operation per request. Please provide exactly one updatable field per call.');
        }

        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.helpscout.net/v2/conversations/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                // HelpScout expects JSON Patch payloads. Use the more specific media type
                // so the server parses the object operation correctly.
                'Content-Type': 'application/json-patch+json'
            },
            // Ensure we send a raw JSON string body of a single patch object to avoid any
            // transport-specific transformations that might change the payload shape.
            data: JSON.stringify(patches[0])
        });

        // HelpScout returns 204 No Content for successful updates
        if (response.status === 204) {
            return context.sendJson({}, 'out');
        }

        return context.sendJson(response.data || {}, 'out');
    }
};

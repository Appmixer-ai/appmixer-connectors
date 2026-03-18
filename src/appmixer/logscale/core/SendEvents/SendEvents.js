'use strict';

module.exports = {

    async receive(context) {

        const {
            events,
            source,
            type,
            repository
        } = context.messages.in.content;

        if (events === undefined || events === null || !String(events).trim()) {
            throw new context.CancelError('Events is required!');
        }

        const requestEntries = parseEntries(events, {
            source,
            type,
            repository
        }, context);
        const requestBody = requestEntries.map(entry => JSON.stringify(entry)).join('\n');

        const response = await context.httpRequest({
            method: 'POST',
            url: context.auth.url,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/octet-stream'
            },
            data: requestBody
        });

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data,
            eventsCount: requestEntries.length,
            requestBody
        }, 'out');
    }
};

function parseEntries(events, defaults, context) {

    const parsed = tryParseJson(events);

    if (Array.isArray(parsed)) {
        if (!parsed.length) {
            throw new context.CancelError('Events is required!');
        }
        return parsed.map(item => normalizeEntry(item, defaults));
    }

    if (parsed && typeof parsed === 'object') {
        return [normalizeEntry(parsed, defaults)];
    }

    return String(events)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parsedLine = tryParseJson(line);
            if (parsedLine === null) {
                throw new context.CancelError('Each batch line must be valid JSON.');
            }
            return normalizeEntry(parsedLine, defaults);
        });
}

function normalizeEntry(entry, defaults) {

    const time = Math.floor(Date.now() / 1000);

    if (entry && typeof entry === 'object' && !Array.isArray(entry) && Object.prototype.hasOwnProperty.call(entry, 'event')) {
        const normalized = { ...entry };

        if (!normalized.time) {
            normalized.time = time;
        }

        if (defaults.source && !normalized.source) {
            normalized.source = defaults.source;
        }

        if (defaults.type && !normalized.sourcetype) {
            normalized.sourcetype = defaults.type;
        }

        if (defaults.repository && !normalized.index) {
            normalized.index = defaults.repository;
        }

        return normalized;
    }

    const normalized = {
        event: entry,
        time
    };

    if (defaults.source) {
        normalized.source = defaults.source;
    }

    if (defaults.type) {
        normalized.sourcetype = defaults.type;
    }

    if (defaults.repository) {
        normalized.index = defaults.repository;
    }

    return normalized;
}

function tryParseJson(value) {

    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
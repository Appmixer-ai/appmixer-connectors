'use strict';

const BASE_URL = 'https://uptime.betterstack.com/api/v2';

module.exports = {
    async receive(context) {
        const {
            monitorId,
            monitorName,
            url,
            monitorType,
            checkFrequency,
            paused,
            email,
            sms,
            call,
            push,
            regions,
            verifySSL,
            requiredKeyword,
            recoveryPeriod,
            confirmationPeriod,
            requestTimeout,
            httpMethod,
            followRedirects,
            port
        } = context.messages.in.content;

        if (!monitorId) {
            throw new context.CancelError('Monitor ID is required!');
        }

        const body = {};

        if (monitorName) body.pronounceable_name = monitorName;
        if (url) body.url = url;
        if (monitorType) body.monitor_type = monitorType;
        if (checkFrequency) body.check_frequency = checkFrequency;
        if (typeof paused === 'boolean') body.paused = paused;
        if (typeof email === 'boolean') body.email = email;
        if (typeof sms === 'boolean') body.sms = sms;
        if (typeof call === 'boolean') body.call = call;
        if (typeof push === 'boolean') body.push = push;
        if (regions) body.regions = regions;
        if (typeof verifySSL === 'boolean') body.verify_ssl = verifySSL;
        if (requiredKeyword) body.required_keyword = requiredKeyword;
        if (recoveryPeriod !== undefined && recoveryPeriod !== null) body.recovery_period = recoveryPeriod;
        if (confirmationPeriod !== undefined && confirmationPeriod !== null) {
            body.confirmation_period = confirmationPeriod;
        }
        if (requestTimeout) body.request_timeout = requestTimeout;
        if (httpMethod) body.http_method = httpMethod;
        if (typeof followRedirects === 'boolean') body.follow_redirects = followRedirects;
        if (port) body.port = port;

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `${BASE_URL}/monitors/${monitorId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson({ id: data.data.id, ...data.data.attributes }, 'out');
    }
};

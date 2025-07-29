'use strict';

module.exports = {

    async receive(context) {

        const {
            name,
            channelFilter,
            audiencesIncluded,
            audiencesExcluded,
            sendStrategyMethod,
            sendStrategyOptionsStaticDatetime,
            sendStrategyOptionsStaticIsLocal,
            sendStrategyOptionsStaticSendPastRecipientsImmediately,
            sendStrategyOptionsThrottledDatetime,
            sendStrategyOptionsThrottledThrottlePercentage,
            sendStrategyOptionsStoDate
        } = context.messages.in.content;

        // Validate required fields
        if (!name) {
            throw new context.CancelError('Campaign name is required!');
        }

        if (!channelFilter) {
            throw new context.CancelError('Channel filter is required!');
        }

        context.log({ step: 'audiencesIncluded', audiencesIncluded });
        if (!audiencesIncluded || audiencesIncluded.length === 0) {
            throw new context.CancelError('At least one included audience is required!');
        }

        // Validate each included audience
        for (const audience of audiencesIncluded) {
            if (!audience.type) {
                throw new context.CancelError('Audience type is required for all included audiences!');
            }
            if (!audience.id) {
                throw new context.CancelError('Audience ID is required for all included audiences!');
            }
        }

        if (!sendStrategyMethod) {
            throw new context.CancelError('Send strategy method is required!');
        }

        // Validate conditional required fields based on send strategy method
        if (sendStrategyMethod === 'static' && !sendStrategyOptionsStaticDatetime) {
            throw new context.CancelError('Static send date/time is required when using static send strategy!');
        }

        if (sendStrategyMethod === 'throttled') {
            if (!sendStrategyOptionsThrottledDatetime) {
                throw new context.CancelError('Throttled send date/time is required when using throttled send strategy!');
            }
            if (!sendStrategyOptionsThrottledThrottlePercentage) {
                throw new context.CancelError('Throttle percentage is required when using throttled send strategy!');
            }
        }

        if (sendStrategyMethod === 'smart_send_time' && !sendStrategyOptionsStoDate) {
            throw new context.CancelError('Smart send time date is required when using smart send time strategy!');
        }

        // Build audiences array
        const audiences = {};

        // Add included audiences
        if (audiencesIncluded && Array.isArray(audiencesIncluded)) {
            audiences.included = audiencesIncluded.map(audience => ({
                data: {
                    type: audience.type.toLowerCase(),
                    id: audience.id
                }
            }));
        }

        // Add excluded audiences if provided
        if (audiencesExcluded && Array.isArray(audiencesExcluded) && audiencesExcluded.length > 0) {
            // Validate each excluded audience
            for (const audience of audiencesExcluded) {
                if (!audience.type) {
                    throw new context.CancelError('Audience type is required for all excluded audiences!');
                }
                if (!audience.id) {
                    throw new context.CancelError('Audience ID is required for all excluded audiences!');
                }
            }

            audiences.excluded = audiencesExcluded.map(audience => ({
                data: {
                    type: audience.type.toLowerCase(),
                    id: audience.id
                }
            }));
        }

        // Build send strategy
        const sendStrategy = {
            method: sendStrategyMethod
        };

        // Add method-specific options
        if (sendStrategyMethod === 'static') {
            sendStrategy.options_static = {
                datetime: sendStrategyOptionsStaticDatetime
            };

            if (sendStrategyOptionsStaticIsLocal !== undefined) {
                sendStrategy.options_static.is_local = sendStrategyOptionsStaticIsLocal;
            }

            if (sendStrategyOptionsStaticSendPastRecipientsImmediately !== undefined) {
                sendStrategy.options_static.send_past_recipients_immediately = sendStrategyOptionsStaticSendPastRecipientsImmediately;
            }
        } else if (sendStrategyMethod === 'throttled') {
            sendStrategy.options_throttled = {
                datetime: sendStrategyOptionsThrottledDatetime,
                throttle_percentage: sendStrategyOptionsThrottledThrottlePercentage
            };
        } else if (sendStrategyMethod === 'smart_send_time') {
            sendStrategy.options_sto = {
                date: sendStrategyOptionsStoDate
            };
        }

        // Build the request payload
        const requestData = {
            data: {
                type: 'campaign',
                attributes: {
                    name,
                    channel_filter: channelFilter,
                    audiences,
                    send_strategy: sendStrategy
                }
            }
        };

        // Make the API request
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/campaigns/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        // Extract and format the response
        const campaign = response.data.data;

        return context.sendJson(campaign, 'out');
    }
};

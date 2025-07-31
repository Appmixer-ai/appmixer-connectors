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

        const audiencesIncludedArr = audiencesIncluded.ADD;

        if (!Array.isArray(audiencesIncludedArr) || audiencesIncludedArr.length === 0) {
            throw new context.CancelError('At least one included audience is required!');
        }

        // Validate each included audience
        for (const audience of audiencesIncludedArr) {
            if (!audience.type) {
                throw new context.CancelError('Audience type is required for all included audiences!');
            }
            if (audience.type === 'segment') {
                if (!audience.segmentId) {
                    throw new context.CancelError('Audience Segment ID is required for all included audiences!');
                }
            } else if (audience.type === 'list') {
                if (!audience.listId) {
                    throw new context.CancelError('Audience List ID is required for all included audiences!');
                }
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
        if (audiencesIncludedArr && Array.isArray(audiencesIncludedArr)) {
            audiences.included = audiencesIncludedArr.map(audience => {
                if (audience.type === 'segment') {
                    return audience.segmentId;
                }
                if (audience.type === 'list') {
                    return audience.listId;
                };
            });
        }

        const audiencesExcludedArr = audiencesExcluded.ADD;

        // Add excluded audiences if provided
        if (audiencesExcludedArr && Array.isArray(audiencesExcludedArr) && audiencesExcludedArr.length > 0) {
            const audiencesExcludedIds = [];

            audiencesExcludedArr.forEach(audience => {
                if (Object.keys(audience).length > 0) {
                    if (audience.type === 'segment') {
                        if (!audience.segmentId) {
                            throw new context.CancelError('Audience Segment ID is required for all included audiences!');
                        }
                        audiencesExcludedIds.push(audience.segmentId);
                    }
                    if (audience.type === 'list') {
                        if (!audience.listId) {
                            throw new context.CancelError('Audience List ID is required for all included audiences!');
                        }
                        audiencesExcludedIds.push(audience.listId);
                    };
                } else {
                    return;
                }
            });

            audiences.excluded = audiencesExcludedIds.length > 0 ? audiencesExcludedIds : undefined;
        }

        // Build send strategy
        const sendStrategy = {
            method: sendStrategyMethod
        };

        // Add method-specific options
        if (sendStrategyMethod === 'static') {
            sendStrategy.datetime = sendStrategyOptionsStaticDatetime;

            if (sendStrategyOptionsStaticIsLocal !== undefined) {
                sendStrategy.options = {
                    is_local: sendStrategyOptionsStaticIsLocal
                };
            }

            if (sendStrategyOptionsStaticSendPastRecipientsImmediately !== undefined) {
                sendStrategy.options = {
                    send_past_recipients_immediately: sendStrategyOptionsStaticSendPastRecipientsImmediately
                };
            }
        } else if (sendStrategyMethod === 'throttled') {
            sendStrategy.datetime = sendStrategyOptionsThrottledDatetime;
            sendStrategy.throttle_percentage = sendStrategyOptionsThrottledThrottlePercentage;
        } else if (sendStrategyMethod === 'smart_send_time') {
            sendStrategy.date = sendStrategyOptionsStoDate;
        }

        // Build the request payload
        const requestData = {
            data: {
                type: 'campaign',
                attributes: {
                    name,
                    audiences,
                    send_strategy: sendStrategy,
                    'campaign-messages': {
                        data: [
                            {
                                type: 'campaign-message',
                                attributes: {
                                    definition: {
                                        channel: channelFilter
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        };

        context.log({ step: 'requestData', requestData });

        // https://developers.klaviyo.com/en/reference/create_campaign
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

        context.log({ step: 'response', response: response.data });

        return context.sendJson(campaign, 'out');
    }
};

'use strict';

module.exports = {

    async receive(context) {

        const {
            campaignId,
            name,
            audiencesIncluded,
            audiencesExcluded,
            sendStrategyMethod,
            staticDatetime,
            staticIsLocal,
            staticSendPastRecipientsImmediately,
            throttledDatetime,
            throttlePercentage,
            stoDate
        } = context.messages.in.content;

        // Validate required campaign ID
        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // Build the request payload
        const requestData = {
            data: {
                type: 'campaign',
                id: campaignId,
                attributes: {}
            }
        };

        // Only include fields that are provided
        if (name) {
            requestData.data.attributes.name = name;
        }

        if (audiencesIncluded || sendStrategyMethod) {
            // Build audiences array if provided
            if (audiencesIncluded) {
                const audiencesIncludedArr = audiencesIncluded.ADD;

                if (Array.isArray(audiencesIncludedArr) && audiencesIncludedArr.length > 0) {
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

                    const audiences = {};

                    // Add included audiences
                    audiences.included = audiencesIncludedArr.map(audience => {
                        if (audience.type === 'segment') {
                            return audience.segmentId;
                        }
                        if (audience.type === 'list') {
                            return audience.listId;
                        }
                    });

                    const audiencesExcludedArr = audiencesExcluded ? audiencesExcluded.ADD : null;

                    // Add excluded audiences if provided
                    if (
                        audiencesExcludedArr &&
                        Array.isArray(audiencesExcludedArr) &&
                        audiencesExcludedArr.length > 0
                    ) {
                        const audiencesExcludedIds = [];

                        audiencesExcludedArr.forEach(audience => {
                            if (Object.keys(audience).length > 0) {
                                if (audience.type === 'segment') {
                                    if (!audience.segmentId) {
                                        throw new context.CancelError('Audience Segment ID is required for all excluded audiences!');
                                    }
                                    audiencesExcludedIds.push(audience.segmentId);
                                }
                                if (audience.type === 'list') {
                                    if (!audience.listId) {
                                        throw new context.CancelError('Audience List ID is required for all excluded audiences!');
                                    }
                                    audiencesExcludedIds.push(audience.listId);
                                }
                            }
                        });

                        if (audiencesExcludedIds.length > 0) {
                            audiences.excluded = audiencesExcludedIds;
                        }
                    }

                    requestData.data.attributes.audiences = audiences;
                }
            }

            // Build send strategy if provided
            if (sendStrategyMethod) {
                const sendStrategy = {
                    method: sendStrategyMethod
                };

                // Validate conditional required fields based on send strategy method
                if (sendStrategyMethod === 'static' && !staticDatetime) {
                    throw new context.CancelError('Static send date/time is required when using static send strategy!');
                }

                if (sendStrategyMethod === 'throttled') {
                    if (!throttledDatetime) {
                        throw new context.CancelError('Throttled send date/time is required when using throttled send strategy!');
                    }
                    if (!throttlePercentage) {
                        throw new context.CancelError('Throttle percentage is required when using throttled send strategy!');
                    }
                }

                if (sendStrategyMethod === 'smart_send_time' && !stoDate) {
                    throw new context.CancelError('Smart send time date is required when using smart send time strategy!');
                }

                // Add method-specific options
                if (sendStrategyMethod === 'static') {
                    sendStrategy.datetime = staticDatetime;

                    if (staticIsLocal !== undefined || staticSendPastRecipientsImmediately !== undefined) {
                        sendStrategy.options = {};
                        if (staticIsLocal !== undefined) {
                            sendStrategy.options.is_local = staticIsLocal;
                        }
                        if (staticSendPastRecipientsImmediately !== undefined) {
                            // Otherwise throws an error:
                            // 'send_past_recipients_immediately' is not a valid field for the resource 'NonLocalStaticSend'
                            if (sendStrategy.options.is_local) {
                                sendStrategy.options
                                    .send_past_recipients_immediately = staticSendPastRecipientsImmediately;
                            }
                        }
                    }
                } else if (sendStrategyMethod === 'throttled') {
                    sendStrategy.datetime = throttledDatetime;
                    sendStrategy.throttle_percentage = throttlePercentage;
                } else if (sendStrategyMethod === 'smart_send_time') {
                    sendStrategy.date = stoDate;
                }

                requestData.data.attributes.send_strategy = sendStrategy;
            }
        }

        // https://developers.klaviyo.com/en/reference/update_campaign
        await context.httpRequest({
            method: 'PATCH',
            url: `https://a.klaviyo.com/api/campaigns/${campaignId}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};

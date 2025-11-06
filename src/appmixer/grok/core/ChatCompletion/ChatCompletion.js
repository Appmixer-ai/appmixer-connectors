'use strict';

module.exports = {
    async receive(context) {

        const {
            model,
            messagesRole,
            messagesContent,
            messagesName,
            messagesToolCallId,
            temperature,
            topP,
            maxTokens,
            presencePenalty,
            frequencyPenalty,
            stop,
            n,
            stream,
            user
        } = context.messages.in.content;

        // Validate required inputs
        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!messagesRole) {
            throw new context.CancelError('Messages Role is required!');
        }
        if (!messagesContent) {
            throw new context.CancelError('Messages Content is required!');
        }

        // Build messages array
        const message = {
            role: messagesRole,
            content: messagesContent
        };

        if (messagesName) {
            message.name = messagesName;
        }
        if (messagesToolCallId) {
            message.tool_call_id = messagesToolCallId;
        }

        // Build request payload
        const payload = {
            model,
            messages: [message]
        };

        if (temperature !== undefined && temperature !== null) {
            payload.temperature = temperature;
        }
        if (topP !== undefined && topP !== null) {
            payload.top_p = topP;
        }
        if (maxTokens !== undefined && maxTokens !== null) {
            payload.max_tokens = maxTokens;
        }
        if (presencePenalty !== undefined && presencePenalty !== null) {
            payload.presence_penalty = presencePenalty;
        }
        if (frequencyPenalty !== undefined && frequencyPenalty !== null) {
            payload.frequency_penalty = frequencyPenalty;
        }
        if (stop) {
            payload.stop = stop;
        }
        if (n !== undefined && n !== null) {
            payload.n = n;
        }
        if (stream !== undefined && stream !== null) {
            payload.stream = stream;
        }
        if (user) {
            payload.user = user;
        }

        // https://docs.x.ai/docs/chat-completions
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};

/* eslint-disable camelcase */

/**
 * Joins the text blocks of a Messages API response in order. A response of a model with
 * extended thinking starts with a `thinking` block, and a response may hold more than
 * one text block (for example around citations), so the first block is not the answer.
 * @param {Object} data Messages API response body.
 * @returns {string}
 */
function getAnswer(data) {

    const content = Array.isArray(data?.content) ? data.content : [];
    return content
        .filter(block => block?.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('');
}

module.exports = {
    async receive(context) {

        const { prompt, system, model, max_tokens } = context.messages.in.content;
        if (!prompt) {
            throw new context.CancelError('Prompt is required');
        }

        if (!model) {
            throw new context.CancelError('Model is required');
        }

        if (!max_tokens) {
            throw new context.CancelError('Max Tokens is required');
        }


        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.anthropic.com/v1/messages',
            headers: {
                'x-api-key': context.auth.apiKey,
                'anthropic-version': '2023-06-01'
            },
            data: {
                system: system || 'You are a helpful assistant.',
                messages: [{ role: 'user', content: prompt }],
                max_tokens,
                model
            }
        });

        const answer = getAnswer(data);

        if (!answer && data?.stop_reason === 'max_tokens') {
            // The model spent the whole budget (typically on extended thinking) before it wrote any text.
            // Sending an empty answer would let the flow continue as if Claude had answered.
            throw new context.CancelError(
                `Claude used all ${max_tokens} Max Tokens before it wrote an answer (stop_reason: max_tokens` +
                `${data?.usage?.output_tokens !== undefined ? `, output tokens: ${data.usage.output_tokens}` : ''}). ` +
                'Models with extended thinking spend output tokens on thinking first. Increase Max Tokens.'
            );
        }

        return context.sendJson({
            answer,
            prompt,
            usage: data?.usage,
            stop_reason: data?.stop_reason,
            model: data?.model
        }, 'out');
    }
};

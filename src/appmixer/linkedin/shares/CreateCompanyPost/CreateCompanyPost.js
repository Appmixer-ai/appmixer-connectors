'use strict';

const { BASE_URL, VERSION_PATH } = require('../../constants');
const { getHeaders } = require('../../lib');

const ORGANIZATION_ID_PATTERN = /^(?:urn:li:organization:)?(\d+)$/;

/**
 * Build the LinkedIn post payload for an organization author.
 * @param {Context} context
 * @param {string} authorUrn Full URN of the organization, e.g. urn:li:organization:12345
 * @returns {Object} Post payload
 */
function buildPost(context, authorUrn) {

    const { visibility, text, url, title, description, specificLink } = context.messages.in.content;

    const shareObject = {
        author: authorUrn,
        commentary: text,
        visibility: visibility || 'PUBLIC',
        distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
    };

    if (specificLink) {

        shareObject.content = {
            article: {
                source: url,
                title,
                description
            }
        };
    }

    return shareObject;
}

/**
 * Component for creating a LinkedIn post as a company/organization page.
 */
module.exports = {

    async receive(context) {

        const { organizationId, text, specificLink, url, title } = context.messages.in.content;

        if (!organizationId) {
            throw new context.CancelError('Organization ID is required!');
        }
        if (!text) {
            throw new context.CancelError('Text is required!');
        }
        if (specificLink && !url) {
            throw new context.CancelError('URL is required when sharing a specific link!');
        }
        if (specificLink && !title) {
            throw new context.CancelError('Title is required when sharing a specific link!');
        }

        // Accept both the numeric ID ("12345") and the full URN ("urn:li:organization:12345").
        const match = String(organizationId).trim().match(ORGANIZATION_ID_PATTERN);
        if (!match) {
            throw new context.CancelError(
                `Invalid organization ID '${organizationId}'. ` +
                'Use the numeric ID (e.g. 12345) or the URN (e.g. urn:li:organization:12345).'
            );
        }
        const orgId = match[1];

        let response;
        try {
            response = await context.httpRequest({
                method: 'POST',
                url: `${BASE_URL}${VERSION_PATH}/posts`,
                headers: {
                    ...getHeaders(context),
                    'Content-Type': 'application/json'
                },
                data: buildPost(context, `urn:li:organization:${orgId}`)
            });
        } catch (err) {
            if (err.response && err.response.status === 403) {
                const detail = err.response.data && err.response.data.message;
                throw new context.CancelError(
                    `LinkedIn rejected the post for organization ${orgId} (403 Forbidden). ` +
                    'Make sure you are an administrator of the page and the account ' +
                    'has granted the w_organization_social permission.' +
                    (detail ? ` LinkedIn says: ${detail}` : '')
                );
            }
            throw err;
        }

        return context.sendJson({
            status: response.status,
            postId: response.headers['x-restli-id']
        }, 'out');
    }
};

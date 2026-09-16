'use strict';

const { BASE_URL, VERSION_PATH, VERSION_HEADER } = require('../../constants');

/**
 * Build the LinkedIn post payload for an organization author.
 * @param {Context} context
 * @param {string} authorUrn  Full URN of the organization, e.g. urn:li:organization:12345
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

        const { organizationId } = context.messages.in.content;

        if (!organizationId) {
            throw new context.CancelError('Organization ID is required!');
        }

        // Accept both numeric ID ("12345") and full URN ("urn:li:organization:12345")
        const orgId = String(organizationId).includes(':')
            ? String(organizationId).split(':').pop()
            : String(organizationId);

        const authorUrn = `urn:li:organization:${orgId}`;

        let response;
        try {
            response = await context.httpRequest({
                method: 'POST',
                url: `${BASE_URL}${VERSION_PATH}/posts`,
                headers: {
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'LinkedIn-Version': VERSION_HEADER,
                    'Content-Type': 'application/json'
                },
                data: buildPost(context, authorUrn)
            });
        } catch (err) {
            if (err.response && err.response.status === 403) {
                throw new context.CancelError(
                    'LinkedIn rejected the request with 403 Forbidden. ' +
                    `Ensure you are an administrator of organization '${orgId}' ` +
                    'and have granted the w_organization_social OAuth scope.'
                );
            }
            throw err;
        }

        return context.sendJson(
            { status: response.status, postId: response.headers['x-restli-id'] },
            'out'
        );
    }
};

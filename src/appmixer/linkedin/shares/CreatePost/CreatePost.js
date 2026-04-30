'use strict';

const axios = require('axios');
const { BASE_URL, VERSION_PATH, VERSION_HEADER } = require('../../constants');

/**
 * Build post.
 * @param {Context} context
 * @param {string} author
 * @param {string|null} assetUrn
 * @return {Object} shareObject
 */
function buildPost(context, author, assetUrn) {

    const { visibility, text, url, title, description, specificLink } = context.messages.in.content;

    const shareObject = {
        author,
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
    } else if (assetUrn) {

        shareObject.content = {
            media: {
                status: 'READY',
                media: assetUrn
            }
        };
    }

    return shareObject;
}

/**
 * Component for sharing a post
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { imageUrl, authorType, organizationId } = context.messages.in.content;

        const author = (authorType === 'Organization' && organizationId)
            ? `urn:li:organization:${organizationId}`
            : `urn:li:person:${context.auth.profileInfo.sub}`;

        let assetUrn = null;

        if (imageUrl) {

            // Step 1: Register upload
            const registerResponse = await context.httpRequest({
                method: 'POST',
                url: `${BASE_URL}v2/assets?action=registerUpload`,
                headers: {
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                        owner: author,
                        serviceRelationships: [
                            {
                                relationshipType: 'OWNER',
                                identifier: 'urn:li:userGeneratedContent'
                            }
                        ]
                    }
                }
            });

            const uploadUrl = registerResponse.data.value.uploadMechanism[
                'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
            ].uploadUrl;
            assetUrn = registerResponse.data.value.asset;

            // Step 2: Download image bytes
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });

            // Step 3: Upload image binary to LinkedIn
            await axios.put(uploadUrl, imageResponse.data, {
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/octet-stream'
                }
            });
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}${VERSION_PATH}/posts`,
            headers: {
                'X-Restli-Protocol-Version': '2.0.0',
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'LinkedIn-Version': VERSION_HEADER,
                'Content-Type': 'application/json'
            },
            data: buildPost(context, author, assetUrn)
        });
        return context.sendJson({ status: response.status, postId: response.headers['x-restli-id'] }, 'out');
    }
};

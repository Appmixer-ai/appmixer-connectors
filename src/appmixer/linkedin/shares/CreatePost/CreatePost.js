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

        const { imageUrl, imageFile, specificLink, authorType, organizationId } = context.messages.in.content;

        const author = (authorType === 'Organization' && organizationId)
            ? `urn:li:organization:${organizationId}`
            : `urn:li:person:${context.auth.profileInfo.sub}`;

        let assetUrn = null;

        const useImage = !specificLink && (imageUrl || imageFile);

        if (useImage) {

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

            let imageBuffer;
            if (imageUrl) {
                // URL takes priority — download from URL
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                imageBuffer = imageResponse.data;
            } else {
                // Fall back to file from Appmixer storage
                const stream = await context.getFileReadStream(imageFile);
                const chunks = [];
                await new Promise((resolve, reject) => {
                    stream.on('data', chunk => chunks.push(chunk));
                    stream.on('end', resolve);
                    stream.on('error', reject);
                });
                imageBuffer = Buffer.concat(chunks);
            }

            // Step 3: Upload image binary to LinkedIn
            await axios.put(uploadUrl, imageBuffer, {
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

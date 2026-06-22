'use strict';

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
                id: assetUrn,
                title: ''
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

        // Validate organizationId when posting as an organization
        if (authorType === 'ORGANIZATION' && !organizationId) {
            throw new context.CancelError('Organization ID is required when posting as an organization!');
        }

        // TODO: Add a ListOrganizations component to let users pick from orgs they administer
        // (via /v2/organizationalEntityAcls) instead of entering a free-form numeric ID.
        // See PR review comment — this is tracked as a separate improvement.
        const author = (authorType === 'ORGANIZATION' && organizationId)
            ? `urn:li:organization:${organizationId}`
            : `urn:li:person:${context.auth.profileInfo.sub}`;

        let assetUrn = null;

        const useImage = !specificLink && (imageUrl || imageFile);

        if (!useImage && (imageUrl || imageFile)) {
            context.log('info', 'Image inputs (imageUrl/imageFile) ignored because specificLink is enabled.');
        }

        if (useImage) {

            // Step 1: Initialize image upload (versioned Images API)
            const registerResponse = await context.httpRequest({
                method: 'POST',
                url: `${BASE_URL}${VERSION_PATH}/images?action=initializeUpload`,
                headers: {
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'LinkedIn-Version': VERSION_HEADER,
                    'Content-Type': 'application/json'
                },
                data: {
                    initializeUploadRequest: {
                        owner: author
                    }
                }
            });

            const uploadUrl = registerResponse.data.value.uploadUrl;
            assetUrn = registerResponse.data.value.image;

            // Step 2: Fetch image data
            let imageBuffer;
            if (imageUrl) {
                // URL takes priority — download from URL
                // Validate URL scheme to prevent SSRF (only http/https allowed)
                // TODO: Add DNS-based private IP blocking for full SSRF protection
                const parsedUrl = new URL(imageUrl);
                if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                    throw new context.CancelError('Image URL must use http or https protocol.');
                }
                const imageResponse = await context.httpRequest({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'arraybuffer',
                    maxContentLength: 20 * 1024 * 1024,
                    maxBodyLength: 20 * 1024 * 1024
                });
                const contentLength = parseInt(imageResponse.headers['content-length'] || '0', 10);
                if (contentLength > 20 * 1024 * 1024) {
                    throw new context.CancelError('Image file exceeds the 20 MB limit.');
                }
                imageBuffer = Buffer.from(imageResponse.data);
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
            await context.httpRequest({
                method: 'PUT',
                url: uploadUrl,
                data: imageBuffer,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/octet-stream'
                },
                maxContentLength: 20 * 1024 * 1024,
                maxBodyLength: 20 * 1024 * 1024
            });
        }

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
                data: buildPost(context, author, assetUrn)
            });
        } catch (err) {
            if (err.response && err.response.status === 403 && authorType === 'ORGANIZATION') {
                throw new context.CancelError(
                    `LinkedIn rejected the request (403). Make sure you are an admin of organization ID "${organizationId}" and have granted the w_organization_social scope.`
                );
            }
            throw err;
        }
        return context.sendJson({ status: response.status, postId: response.headers['x-restli-id'] }, 'out');
    }
};

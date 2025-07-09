
'use strict';

module.exports = {
    async receive(context) {
        const {
            teamId,
            avatar,
            description,
            emailDomain,
            name,
            previewDeploymentSuffix,
            regenerateInviteCode,
            saml,
            slug,
            enablePreviewFeedback,
            enableProductionFeedback,
            sensitiveEnvironmentVariablePolicy,
            remoteCaching,
            hideIpAddresses,
            hideIpAddressesInLogDrains
        } = context.messages.in.content;

        const requestData = {};

        // Add properties to request data only if they're defined
        if (avatar !== undefined) requestData.avatar = avatar;
        if (description !== undefined) requestData.description = description;
        if (emailDomain !== undefined) requestData.emailDomain = emailDomain;
        if (name !== undefined) requestData.name = name;
        if (previewDeploymentSuffix !== undefined) requestData.previewDeploymentSuffix = previewDeploymentSuffix;
        if (regenerateInviteCode !== undefined) requestData.regenerateInviteCode = regenerateInviteCode;
        if (saml !== undefined) requestData.saml = saml;
        if (slug !== undefined) requestData.slug = slug;
        if (enablePreviewFeedback !== undefined) requestData.enablePreviewFeedback = enablePreviewFeedback;
        if (enableProductionFeedback !== undefined) requestData.enableProductionFeedback = enableProductionFeedback;
        if (sensitiveEnvironmentVariablePolicy !== undefined) {
            requestData.sensitiveEnvironmentVariablePolicy = sensitiveEnvironmentVariablePolicy;
        }
        if (remoteCaching !== undefined) requestData.remoteCaching = remoteCaching;
        if (hideIpAddresses !== undefined) requestData.hideIpAddresses = hideIpAddresses;
        if (hideIpAddressesInLogDrains !== undefined) {
            requestData.hideIpAddressesInLogDrains = hideIpAddressesInLogDrains;
        }

        // https://spec.speakeasy.com/vercel/vercel-docs/vercel-oas-with-code-samples
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.vercel.com/v2/teams/${teamId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};

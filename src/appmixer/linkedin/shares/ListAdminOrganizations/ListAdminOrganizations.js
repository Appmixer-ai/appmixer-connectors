'use strict';

const { BASE_URL, VERSION_PATH, VERSION_HEADER } = require('../../constants');

/**
 * Fetch the list of organizations where the authenticated user is an ADMINISTRATOR.
 * When used as a dynamic source (isSource=true), also resolves the display name
 * of each organization by calling the organizations endpoint.
 */
module.exports = {

    async receive(context) {

        const { isSource } = context.messages.in.content;

        // Fetch organizations where the user holds the ADMINISTRATOR role
        const aclResponse = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}${VERSION_PATH}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&count=100`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'LinkedIn-Version': VERSION_HEADER,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        const elements = (aclResponse.data && aclResponse.data.elements) || [];

        if (isSource) {

            // Resolve display names so the dropdown shows org names, not raw IDs
            const orgs = await Promise.all(elements.map(async (element) => {

                const orgUrn = element.organization || '';
                const orgId = orgUrn.split(':').pop();
                let name = `Organization ${orgId}`;

                try {
                    const orgResponse = await context.httpRequest({
                        method: 'GET',
                        url: `${BASE_URL}${VERSION_PATH}/organizations/${orgId}`,
                        headers: {
                            'Authorization': `Bearer ${context.auth.accessToken}`,
                            'LinkedIn-Version': VERSION_HEADER,
                            'X-Restli-Protocol-Version': '2.0.0'
                        }
                    });
                    name = orgResponse.data.localizedName || name;
                } catch (e) {
                    // Fallback to "Organization <id>" if the name lookup fails
                    context.log('warn', `Could not resolve name for organization ${orgId}: ${e.message}`);
                }

                return { id: orgId, name };
            }));

            if (orgs.length === 0) {
                return context.sendJson({}, 'out');
            }
            return context.sendJson(orgs, 'out');
        }

        return context.sendJson(elements, 'out');
    },

    /**
     * Transform function used by the CreateCompanyPost component.json source entry
     * to convert the raw organization list into a select-friendly array.
     *
     * @param {Array} orgs  Array of { id, name } objects returned by this component
     * @returns {Array}     Array of { label, value } objects for a select dropdown
     */
    organizationsToSelectArray(orgs) {

        if (!Array.isArray(orgs)) return [];
        return orgs.map(org => ({ label: org.name, value: org.id }));
    }
};

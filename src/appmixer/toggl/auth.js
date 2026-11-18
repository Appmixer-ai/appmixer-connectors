'use strict';

const lib = require('./lib');

// Toggl API key authentication.
// https://engineering.toggl.com/docs/focus/start/authentication/
// The key (toggl_sk_...) is generated in the Toggl account settings and sent as a Bearer token.
// It belongs to the user and carries their permissions in every organization and workspace.
// Keys of the legacy Toggl Track API (api.track.toggl.com) are a different credential and are
// rejected here.

const get = async (context, path, params) => {

    try {
        return await context.httpRequest({
            method: 'GET',
            url: `${lib.API_BASE_URL}${path}`,
            params,
            headers: lib.authHeaders(context.apiKey)
        });
    } catch (err) {
        const status = err.response && err.response.status;
        if (status === 401) {
            throw new Error(
                'Toggl rejected the API token (401). Generate a new one in Toggl: profile icon > Profile settings > ' +
                'API token, and paste the whole value starting with "toggl_sk_". Generating a token revokes the ' +
                'previous one. API tokens of the legacy Toggl Track do not work here.'
            );
        }
        if (status === 403 || status === 404) {
            throw new Error(
                'Toggl denied access to the organization or workspace (' + status + '). Check the Organization ID ' +
                'and Workspace ID: they are the two numbers in the Toggl URL, ' +
                'focus.toggl.com/<organization>/workspaces/<workspace>/...'
            );
        }
        throw err;
    }
};

/**
 * The organization and workspace of the account: the ones typed in, or the default workspace.
 */
const resolveScope = async (context) => {

    const organizationId = String(context.organizationId || '').trim();
    const workspaceId = String(context.workspaceId || '').trim();

    if (organizationId || workspaceId) {
        if (!/^\d+$/.test(organizationId) || !/^\d+$/.test(workspaceId)) {
            throw new Error('Fill in both Organization ID and Workspace ID (numbers), or leave both empty.');
        }
        // Proves the key can work in that workspace.
        await get(context, `/organizations/${organizationId}/workspaces/${workspaceId}/projects`, { per_page: 1 });
        return { organizationId, workspaceId };
    }

    const { data } = await get(context, '/users/me/landing-workspace');
    if (!data || !data.organization_id || !data.workspace_id) {
        throw new Error(
            'The Toggl account has no default workspace. Fill in Organization ID and Workspace ID: they are the ' +
            'two numbers in the Toggl URL, focus.toggl.com/<organization>/workspaces/<workspace>/...'
        );
    }
    return { organizationId: String(data.organization_id), workspaceId: String(data.workspace_id) };
};

/**
 * Name of the workspace, for the account label. Best effort: a guest may not see the members.
 */
const workspaceName = async (context, { organizationId, workspaceId }) => {

    try {
        const { data } = await get(context, `/organizations/${organizationId}/users`, {
            workspaces: workspaceId,
            per_page: 1
        });
        const user = Array.isArray(data) ? data[0] : null;
        const workspace = user && (user.workspaces || []).find(item => String(item.id) === workspaceId);
        return workspace && workspace.name;
    } catch (err) {
        return undefined;
    }
};

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'password',
                name: 'API Token',
                tooltip: 'In Toggl, click your profile icon > Profile settings, scroll to API token, pick an expiration and generate the token. Copy it right away: it starts with "toggl_sk_" and is shown only once. Generating a new token revokes the previous one. API tokens of the legacy Toggl Track do not work.'
            },
            organizationId: {
                type: 'text',
                name: 'Organization ID',
                tooltip: 'Optional. Leave empty, together with Workspace ID, to use your default workspace. To work in another workspace, fill in both: they are the two numbers in the Toggl URL, focus.toggl.com/<organization>/workspaces/<workspace>/...'
            },
            workspaceId: {
                type: 'text',
                name: 'Workspace ID',
                tooltip: 'Optional. The second number in the Toggl URL, focus.toggl.com/<organization>/workspaces/<workspace>/... Fill in together with Organization ID.'
            }
        },

        accountNameFromProfileInfo: 'name',

        requestProfileInfo: async (context) => {

            const scope = await resolveScope(context);
            const name = await workspaceName(context, scope);

            return {
                id: `${scope.organizationId}-${scope.workspaceId}`,
                name: name ? `${name} (workspace ${scope.workspaceId})` : `Toggl workspace ${scope.workspaceId}`,
                organization_id: scope.organizationId,
                workspace_id: scope.workspaceId
            };
        },

        validate: async (context) => {

            await resolveScope(context);

            return true;
        }
    }
};

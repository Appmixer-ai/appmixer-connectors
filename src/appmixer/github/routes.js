'use strict';

const lib = require('./lib');

// GitHub organization webhooks deliver to ONE URL per webhook, and an organization webhook can
// only be managed by an organization owner. So the connector does not register webhooks itself:
// an owner points an organization webhook at this plugin's endpoint once
// (`<API_BASE>/plugins/appmixer/github/events`, see README), and every trigger that wants the
// events subscribes with `context.addListener()`. Deliveries are verified against the
// `webhookSecret` of the connector's service configuration before anything is routed.
// Actions a Dependabot listener gets when it does not choose any: the ones that mean
// "there is (again) an open vulnerability to fix".
const DEPENDABOT_DEFAULT_ACTIONS = ['created', 'reintroduced', 'reopened', 'auto_reopened'];
const DEPENDENCY_SCOPES = ['runtime', 'development'];

const nonEmptyList = (value, fallback) => (Array.isArray(value) && value.length ? value : fallback);

/**
 * Dependabot alerts of private repositories are sensitive, and the organization webhook delivers
 * them for every repository of the organization. A listener therefore gets them only when the
 * account behind it can read them on GitHub itself: the alerts of the chosen repository, or, with
 * no repository, the organization-wide alerts (organization owners and security managers).
 * @param {Object} context
 * @param {string} organization - lowercased login
 * @param {Object} params - listener params, `accessToken` of the trigger's account
 * @return {Promise<string>} the repository as lowercased `owner/name`, or '' for all of them
 */
async function authorizeDependabotListener(context, organization, params) {

    if (!params.accessToken) {
        throw new Error('A Dependabot alert listener needs the access token of its account.');
    }

    let repository = String(params.repository || '').trim().toLowerCase();
    if (repository && !repository.includes('/')) {
        repository = `${organization}/${repository}`;
    }
    if (repository && repository.split('/')[0] !== organization) {
        throw new Error(`Repository ${repository} does not belong to the organization ${organization}.`);
    }

    const path = repository ? `repos/${repository}` : `orgs/${organization}`;
    try {
        await context.httpRequest({
            method: 'GET',
            url: `https://api.github.com/${path}/dependabot/alerts`,
            params: { per_page: 1 },
            headers: {
                'accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Authorization': `Bearer ${params.accessToken}`
            }
        });
    } catch (err) {
        const status = err.response?.status;
        throw new Error(repository
            ? `The account cannot read the Dependabot alerts of ${repository} (HTTP ${status || err.message}).`
            : `The account cannot read the organization-wide Dependabot alerts of ${organization} (HTTP ${status || err.message}); only organization owners and security managers can. Set Repository to watch one repository.`);
    }
    return repository;
}

module.exports = async context => {

    context.onListenerAdded(async listener => {

        const params = listener.params || {};
        if (!params.organization) {
            throw new Error('A listener needs the organization whose webhook it consumes.');
        }
        const organization = String(params.organization).trim().toLowerCase();

        if (listener.eventName === 'dependabot_alert') {
            const repository = await authorizeDependabotListener(context, organization, params);
            // The access token only proves access here; it is not stored with the listener.
            listener.params = {
                organization,
                repository,
                events: nonEmptyList(params.events, DEPENDABOT_DEFAULT_ACTIONS),
                severities: nonEmptyList(params.severities, []).map(severity => String(severity).toLowerCase()),
                scope: DEPENDENCY_SCOPES.includes(params.scope) ? params.scope : ''
            };
            return;
        }

        listener.params = {
            organization,
            projectNodeId: String(params.projectNodeId || '').trim(),
            events: nonEmptyList(params.events, ['edited'])
        };
    });

    context.http.router.register({
        method: 'POST',
        path: '/events',
        options: {
            auth: false,
            // GitHub signs the raw body; keep it unparsed so the digest is computed over the exact
            // bytes GitHub sent, not over a re-serialization.
            payload: {
                parse: false,
                output: 'data'
            },
            handler: async (req, h) => {

                const event = req.headers['x-github-event'];
                const delivery = req.headers['x-github-delivery'];
                await context.log('info', 'github-plugin-route-events-hit', { event, delivery });

                const secret = context.config?.webhookSecret;
                if (!secret) {
                    await context.log('error', 'github-plugin-route-events-missing-webhookSecret');
                    return h.response({ error: 'The connector has no webhookSecret configured.' }).code(401);
                }
                const valid = lib.verifyWebhookSignature({
                    payload: req.payload,
                    signatureHeader: req.headers['x-hub-signature-256'],
                    secret
                });
                if (!valid) {
                    await context.log('error', 'github-plugin-route-events-invalid-signature', { event, delivery });
                    return h.response({ error: 'Invalid X-Hub-Signature-256.' }).code(401);
                }

                let payload;
                try {
                    payload = JSON.parse(Buffer.isBuffer(req.payload) ? req.payload.toString('utf8') : String(req.payload || ''));
                } catch (err) {
                    return h.response({ error: 'The body is not JSON.' }).code(400);
                }

                // GitHub sends `ping` right after the webhook is created.
                if (event === 'ping') {
                    return { ok: true, zen: payload.zen };
                }

                if (event === 'projects_v2_item') {
                    await routeProjectItem(context, payload);
                    return { ok: true };
                }

                if (event === 'dependabot_alert') {
                    await routeDependabotAlert(context, payload);
                    return { ok: true };
                }

                // Other events of the same webhook (nothing consumes them yet) are acknowledged, so
                // GitHub does not mark the delivery as failed.
                await context.log('debug', 'github-plugin-route-events-unhandled', { event, delivery });
                return { ok: true, ignored: event };
            }
        }
    });

    /**
     * Fans a `projects_v2_item` delivery to the triggers subscribed to its organization, board
     * and action.
     * @param {Object} context
     * @param {Object} payload
     */
    async function routeProjectItem(context, payload) {

        const organization = String(payload.organization?.login || '').toLowerCase();
        const item = payload.projects_v2_item || {};
        const action = payload.action || '';
        if (!organization || !item.node_id) {
            await context.log('error', 'github-plugin-route-events-projects_v2_item-malformed', { action });
            return;
        }

        await context.triggerListeners({
            eventName: 'projects_v2_item',
            payload,
            filter: listener => {
                const { organization: wanted, projectNodeId, events } = listener.params || {};
                return wanted === organization
                    && (!projectNodeId || projectNodeId === item.project_node_id)
                    && (events || []).includes(action);
            }
        });
    }

    /**
     * Fans a `dependabot_alert` delivery to the triggers subscribed to its organization and, where
     * they set them, its repository, action, severity and dependency scope.
     * @param {Object} context
     * @param {Object} payload
     */
    async function routeDependabotAlert(context, payload) {

        const organization = String(payload.organization?.login || payload.repository?.owner?.login || '').toLowerCase();
        const alert = payload.alert || {};
        const action = payload.action || '';
        if (!organization || !alert.number) {
            await context.log('error', 'github-plugin-route-events-dependabot_alert-malformed', { action });
            return;
        }

        const fullName = String(payload.repository?.full_name || '').toLowerCase();
        const severity = String(alert.security_advisory?.severity || alert.security_vulnerability?.severity || '')
            .toLowerCase();
        const scope = alert.dependency?.scope || '';

        await context.triggerListeners({
            eventName: 'dependabot_alert',
            payload,
            filter: listener => {
                const params = listener.params || {};
                const severities = params.severities || [];
                return params.organization === organization
                    && (!params.repository || params.repository === fullName)
                    && (params.events || []).includes(action)
                    && (!severities.length || severities.includes(severity))
                    && (!params.scope || params.scope === scope);
            }
        });
    }
};

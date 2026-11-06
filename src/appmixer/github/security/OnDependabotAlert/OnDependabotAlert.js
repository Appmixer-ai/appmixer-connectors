'use strict';

const lib = require('../../lib');

const DEFAULT_ACTIONS = ['created', 'reintroduced', 'reopened', 'auto_reopened'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];

// Multiselects arrive as arrays from the Designer, but a flow can also hand over a
// comma-separated string.
const toList = value => {

    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    if (typeof value === 'string' && value.trim()) {
        return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
};

const normalizeActions = actions => {

    const list = toList(actions);
    return list.length ? list : DEFAULT_ACTIONS;
};

const normalizeSeverities = severities => toList(severities).map(severity => severity.toLowerCase());

const normalizeScope = scope => (['runtime', 'development'].includes(scope) ? scope : '');

const toOutput = payload => {

    const alert = payload.alert || {};
    const advisory = alert.security_advisory || {};
    const vulnerability = alert.security_vulnerability || {};
    const dependency = alert.dependency || {};
    const repository = payload.repository || {};
    const cvssScore = advisory.cvss_severities?.cvss_v4?.score || advisory.cvss_severities?.cvss_v3?.score
        || advisory.cvss?.score || 0;

    return {
        action: payload.action || '',
        alert: {
            number: alert.number,
            state: alert.state || '',
            html_url: alert.html_url || '',
            created_at: alert.created_at || '',
            updated_at: alert.updated_at || '',
            fixed_at: alert.fixed_at || '',
            dismissed_at: alert.dismissed_at || '',
            dismissed_reason: alert.dismissed_reason || ''
        },
        dependency: {
            ecosystem: dependency.package?.ecosystem || '',
            package_name: dependency.package?.name || '',
            manifest_path: dependency.manifest_path || '',
            scope: dependency.scope || '',
            relationship: dependency.relationship || ''
        },
        advisory: {
            ghsa_id: advisory.ghsa_id || '',
            cve_id: advisory.cve_id || '',
            summary: advisory.summary || '',
            severity: advisory.severity || vulnerability.severity || '',
            cvss_score: cvssScore,
            published_at: advisory.published_at || '',
            html_url: advisory.ghsa_id ? `https://github.com/advisories/${advisory.ghsa_id}` : ''
        },
        vulnerability: {
            vulnerable_version_range: vulnerability.vulnerable_version_range || '',
            first_patched_version: vulnerability.first_patched_version?.identifier || ''
        },
        repository: {
            full_name: repository.full_name || '',
            name: repository.name || '',
            html_url: repository.html_url || '',
            private: !!repository.private
        },
        organization: {
            login: payload.organization?.login || repository.owner?.login || ''
        },
        sender: {
            login: payload.sender?.login || '',
            type: payload.sender?.type || ''
        }
    };
};

// The deliveries come through the connector's plugin route (`/plugins/appmixer/github/events`),
// which an organization owner points an organization webhook at once (see README). The plugin
// verifies the signature and matches organization, repository, action, severity and scope; the
// trigger only subscribes. No webhook is registered on GitHub.
module.exports = {

    async start(context) {

        const { organization, repository, events, severities, scope } = context.properties;

        if (!organization) {
            throw new context.CancelError('Organization is required!');
        }

        // The plugin checks with this token that the account can read the alerts it subscribes
        // to (they are sensitive for private repositories) and does not store it.
        return context.addListener('dependabot_alert', {
            accessToken: context.accessToken || context.auth?.accessToken,
            organization,
            repository: repository || '',
            events: normalizeActions(events),
            severities: normalizeSeverities(severities),
            scope: normalizeScope(scope)
        });
    },

    async stop(context) {

        return context.removeListener('dependabot_alert');
    },

    async receive(context) {

        if (!context.messages.webhook) return;

        const data = context.messages.webhook.content.data || {};
        if (!data.alert) return;

        return context.sendJson(toOutput(data), 'out');
    },

    async test(context) {

        const { organization, repository, severities, scope } = context.properties;

        if (!organization) {
            throw new Error('Organization is required.');
        }
        if (!repository) {
            // Organization-wide alerts are readable only by owners and security managers; one
            // repository's alerts by anyone with access to it.
            throw new Error('Set Repository to use Flow Test Mode: the test reads the newest alert of that repository.');
        }

        const fullName = repository.includes('/') ? repository : `${organization}/${repository}`;
        const params = { sort: 'created', direction: 'desc' };
        const wantedSeverities = normalizeSeverities(severities).filter(severity => SEVERITIES.includes(severity));
        if (wantedSeverities.length) params.severity = wantedSeverities.join(',');
        if (normalizeScope(scope)) params.scope = normalizeScope(scope);

        // Read-only: the newest matching alert is wrapped in the payload shape of a real
        // `dependabot_alert` delivery so Flow Test Mode yields real data.
        const { data: alerts } = await lib.apiRequest(context, `repos/${fullName}/dependabot/alerts`, { params });
        const alert = Array.isArray(alerts) ? alerts[0] : null;
        if (!alert) {
            throw new Error(`No Dependabot alerts in ${fullName} to use as test data.`);
        }

        const { data: repo } = await lib.apiRequest(context, `repos/${fullName}`);
        const profile = context.auth?.profileInfo || {};

        return context.sendJson(toOutput({
            action: 'created',
            alert,
            repository: repo,
            organization: { login: repo?.owner?.login || organization },
            sender: { login: profile.login, type: profile.type }
        }), 'out');
    }
};

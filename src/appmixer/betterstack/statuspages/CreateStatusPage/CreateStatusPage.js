'use strict';

module.exports = {

    async receive(context) {

        const {
            companyName,
            companyUrl,
            subdomain,
            timezone,
            contactUrl,
            logoUrl,
            history,
            minIncidentLength,
            subscribable,
            hideFromSearchEngines,
            customCss,
            customJavascript,
            design,
            theme,
            layout,
            googleAnalyticsId,
            announcement,
            announcementEmbedVisible,
            announcementEmbedLink,
            announcementEmbedCss,
            automaticReports,
            passwordEnabled,
            password,
            ipAllowlist,
            statusPageGroupId
        } = context.messages.in.content;

        if (!companyName) {
            throw new context.CancelError('Company name is required!');
        }

        if (!companyUrl) {
            throw new context.CancelError('Company URL is required!');
        }

        if (!subdomain) {
            throw new context.CancelError('Subdomain is required!');
        }

        if (!timezone) {
            throw new context.CancelError('Timezone is required!');
        }

        const body = {
            company_name: companyName,
            company_url: companyUrl,
            subdomain: subdomain,
            timezone: timezone
        };

        // Add optional fields
        if (contactUrl) body.contact_url = contactUrl;
        if (logoUrl) body.logo_url = logoUrl;
        if (history) body.history = history;
        if (minIncidentLength) body.min_incident_length = minIncidentLength;
        if (subscribable !== undefined) body.subscribable = subscribable;
        if (hideFromSearchEngines !== undefined) body.hide_from_search_engines = hideFromSearchEngines;
        if (customCss) body.custom_css = customCss;
        if (customJavascript) body.custom_javascript = customJavascript;
        if (design) body.design = design;
        if (theme) body.theme = theme;
        if (layout) body.layout = layout;
        if (googleAnalyticsId) body.google_analytics_id = googleAnalyticsId;
        if (announcement) body.announcement = announcement;
        if (announcementEmbedVisible !== undefined) body.announcement_embed_visible = announcementEmbedVisible;
        if (announcementEmbedLink) body.announcement_embed_link = announcementEmbedLink;
        if (announcementEmbedCss) body.announcement_embed_css = announcementEmbedCss;
        if (automaticReports !== undefined) body.automatic_reports = automaticReports;
        if (passwordEnabled !== undefined) body.password_enabled = passwordEnabled;
        if (password) body.password = password;
        if (ipAllowlist) body.ip_allowlist = ipAllowlist;
        if (statusPageGroupId) body.status_page_group_id = statusPageGroupId;

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://uptime.betterstack.com/api/v2/status-pages',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        const result = { ...response.data.data.attributes, id: response.data.data.id };
        return context.sendJson(result, 'out');
    }
};

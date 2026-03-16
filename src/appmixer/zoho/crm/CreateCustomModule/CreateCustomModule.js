'use strict';

const ZohoClient = require('../../ZohoClient');

module.exports = {

    async receive(context) {

        const {
            moduleName,
            singularLabel,
            pluralLabel,
            description,
            enableRecordDuplicateCheck,
            enableApprovalWorkflow,
            enableWebForm
        } = context.messages.in.content;

        if (!moduleName) {
            throw new context.CancelError('Module Name is required!');
        }

        if (!singularLabel) {
            throw new context.CancelError('Singular Label is required!');
        }

        if (!pluralLabel) {
            throw new context.CancelError('Plural Label is required!');
        }

        // ZohoClient will use context.profileInfo.region which is set by auth.js
        const zc = new ZohoClient(context);

        // Fetch available profiles - required by Zoho API
        let profiles = [];
        try {
            const profilesResponse = await zc.request('GET', '/crm/v8/settings/profiles');
            if (profilesResponse.profiles && Array.isArray(profilesResponse.profiles) && profilesResponse.profiles.length > 0) {
                profiles = profilesResponse.profiles.map(p => ({ id: p.id }));
            } else if (profilesResponse.data && Array.isArray(profilesResponse.data) && profilesResponse.data.length > 0) {
                // Handle alternative response format
                profiles = profilesResponse.data.map(p => ({ id: p.id }));
            }
        } catch (error) {
            console.log('Error fetching profiles:', error);
            // If profiles fetch fails, throw error as profiles are mandatory
            throw new context.CancelError(`Failed to fetch profiles: ${error.message || JSON.stringify(error)}`);
        }

        if (profiles.length === 0) {
            throw new context.CancelError('No profiles available in your Zoho CRM account. Custom modules require at least one profile.');
        }

        const requestBody = {
            modules: [{
                api_name: moduleName, singular_label: singularLabel, plural_label: pluralLabel, channels: [{
                    name: 'web'
                }], profiles: profiles
            }]
        };

        if (description) {
            requestBody.modules[0].description = description;
        }

        const moduleSettings = {};
        if (enableRecordDuplicateCheck !== undefined && enableRecordDuplicateCheck !== null) {
            moduleSettings.enable_record_duplicate_check = enableRecordDuplicateCheck;
        }
        if (enableApprovalWorkflow !== undefined && enableApprovalWorkflow !== null) {
            moduleSettings.enable_approval_workflow = enableApprovalWorkflow;
        }
        if (enableWebForm !== undefined && enableWebForm !== null) {
            moduleSettings.enable_web_form = enableWebForm;
        }

        if (Object.keys(moduleSettings).length > 0) {
            requestBody.modules[0].module_settings = moduleSettings;
        }

        try {
            const response = await zc.request('POST', '/crm/v8/settings/modules', {
                data: requestBody
            });

            // Extract module data from response
            const module = response.modules && response.modules[0] ? response.modules[0] : {};

            // Build output object with available data
            const output = {
                moduleId: module.id || null,
                apiName: module.api_name || moduleName,
                singularLabel: module.singular_label || singularLabel,
                pluralLabel: module.plural_label || pluralLabel,
                description: module.description || description || null,
                createdTime: module.created_time || new Date().toISOString(),
                status: 'created'
            };

            return context.sendJson(output, 'out');
        } catch (error) {
            const errorMessage = error.message || JSON.stringify(error);
            throw new context.CancelError(`Failed to create custom module: ${errorMessage}`);
        }
    }
};

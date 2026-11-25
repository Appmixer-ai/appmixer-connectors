'use strict';
const commons = require('../lib');

/**
 * Build the CampaignMember record from the component input.
 * @param {Object} input
 * @return {Object}
 */
function buildCampaignMember({ campaignId, contactId, leadId, status }) {

    const member = { CampaignId: campaignId };
    if (contactId) {
        member.ContactId = contactId;
    } else {
        member.LeadId = leadId;
    }
    if (status) {
        member.Status = status;
    }
    return member;
}

/**
 * Add a contact or a lead to a campaign (creates a CampaignMember record).
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { campaignId, contactId, leadId, status } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign is required!');
        }
        if (!contactId && !leadId) {
            throw new context.CancelError('Either Contact or Lead is required!');
        }
        if (contactId && leadId) {
            throw new context.CancelError('Fill in either Contact or Lead, not both.');
        }

        const client = commons.getSalesforceAPI(context);
        const member = buildCampaignMember({ campaignId, contactId, leadId, status });

        let created;
        try {
            created = await client.sobject('CampaignMember').create(member);
        } catch (err) {
            if (err && (err.errorCode === 'DUPLICATE_VALUE' || err.name === 'DUPLICATE_VALUE')) {
                throw new context.CancelError(
                    `The ${contactId ? 'contact' : 'lead'} is already a member of this campaign.`
                );
            }
            throw err;
        }

        const record = await client.sobject('CampaignMember').retrieve(created.id);
        return context.sendJson(record, 'out');
    },

    buildCampaignMember
};

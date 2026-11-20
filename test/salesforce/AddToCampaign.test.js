'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../utils');

const CRM = path.join(__dirname, '../../src/appmixer/salesforce/crm');
const commons = require(path.join(CRM, 'lib.js'));
const component = require(path.join(CRM, 'AddToCampaign', 'AddToCampaign.js'));

describe('appmixer.salesforce.crm.AddToCampaign', () => {

    let context;
    let sobject;

    beforeEach(() => {
        context = createMockContext();
        sobject = {
            create: sinon.stub().resolves({ id: '00vMEMBER', success: true, errors: [] }),
            retrieve: sinon.stub().resolves({ Id: '00vMEMBER', CampaignId: '701CAMP', ContactId: '003CONT', Status: 'Responded' })
        };
        sinon.stub(commons, 'getSalesforceAPI').returns({ sobject: sinon.stub().returns(sobject) });
    });

    afterEach(() => sinon.restore());

    it('creates a CampaignMember for a contact and sends the retrieved record', async () => {
        context.messages = { in: { content: { campaignId: '701CAMP', contactId: '003CONT', status: 'Responded' } } };

        await component.receive(context);

        assert.deepStrictEqual(sobject.create.firstCall.args[0], { CampaignId: '701CAMP', ContactId: '003CONT', Status: 'Responded' });
        assert.strictEqual(sobject.retrieve.firstCall.args[0], '00vMEMBER');
        assert.deepStrictEqual(context.sendJson.firstCall.args, [
            { Id: '00vMEMBER', CampaignId: '701CAMP', ContactId: '003CONT', Status: 'Responded' },
            'out'
        ]);
    });

    it('creates a CampaignMember for a lead without a status', async () => {
        context.messages = { in: { content: { campaignId: '701CAMP', leadId: '00QLEAD' } } };

        await component.receive(context);

        assert.deepStrictEqual(sobject.create.firstCall.args[0], { CampaignId: '701CAMP', LeadId: '00QLEAD' });
    });

    it('requires a campaign and exactly one of contact or lead', async () => {
        for (const content of [
            { contactId: '003CONT' },
            { campaignId: '701CAMP' },
            { campaignId: '701CAMP', contactId: '003CONT', leadId: '00QLEAD' }
        ]) {
            context.messages = { in: { content } };
            await assert.rejects(component.receive(context), err => err.name === 'CancelError');
        }
        assert.strictEqual(sobject.create.callCount, 0);
    });

    it('turns a duplicate membership into a CancelError', async () => {
        const dup = new Error('Already a campaign member.');
        dup.errorCode = 'DUPLICATE_VALUE';
        sobject.create.rejects(dup);
        context.messages = { in: { content: { campaignId: '701CAMP', contactId: '003CONT' } } };

        await assert.rejects(component.receive(context), err => err.name === 'CancelError' && /already a member/.test(err.message));
    });
});

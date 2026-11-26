'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../../utils');

const DeleteAppointment = require(path.join(__dirname, '../../../src/appmixer/zoho/crm/DeleteAppointment/DeleteAppointment.js'));

const contextFor = (appointmentId, client) => {
    const context = createMockContext();
    context.auth = { accessToken: 'token' };
    context.profileInfo = { region: 'eu' };
    context.messages = { in: { content: { appointmentId } } };
    context.httpRequest.create = sinon.stub().returns(client);
    return context;
};

const success = id => ({ code: 'SUCCESS', details: { id }, message: 'record deleted', status: 'success' });

describe('appmixer.zoho.crm.DeleteAppointment', () => {

    it('deletes one appointment and sends {}', async () => {
        const client = sinon.stub().resolves({ data: { data: [success('1001')] } });
        const context = contextFor('1001', client);

        await DeleteAppointment.receive(context);

        const request = client.firstCall.args[0];
        assert.strictEqual(request.method, 'DELETE');
        assert.strictEqual(request.url, '/crm/v8/Appointments__s');
        assert.deepStrictEqual(request.params, { ids: '1001' });
        assert.strictEqual(request.data, undefined);
        assert(context.sendJson.calledOnceWithExactly({}, 'out'));
    });

    it('deletes a comma-separated list, trimmed and deduplicated', async () => {
        const client = sinon.stub().resolves({ data: { data: [success('1001'), success('1002')] } });
        const context = contextFor(' 1001, 1002,,1001 ', client);

        await DeleteAppointment.receive(context);

        assert.deepStrictEqual(client.firstCall.args[0].params, { ids: '1001,1002' });
        assert(context.sendJson.calledOnceWithExactly({}, 'out'));
    });

    it('fails when Zoho reports a per-record error in a 200 response', async () => {
        const client = sinon.stub().resolves({
            data: {
                data: [
                    success('1001'),
                    { code: 'INVALID_DATA', details: { id: '1002' }, message: 'the related id given seems to be invalid', status: 'error' }
                ]
            }
        });
        const context = contextFor('1001,1002', client);

        await assert.rejects(DeleteAppointment.receive(context), err => {
            assert.strictEqual(err.name, 'CancelError');
            assert.match(err.message, /did not delete 1 of 2 appointment\(s\): 1002: INVALID_DATA the related id/);
            return true;
        });
        assert(context.sendJson.notCalled);
    });

    it('reports the per-record error of a 4xx response', async () => {
        const error = new Error('Request failed with status code 400');
        error.response = { data: { data: [{ code: 'INVALID_DATA', details: {}, message: 'invalid id', status: 'error' }] } };
        const client = sinon.stub().rejects(error);
        const context = contextFor('999', client);

        await assert.rejects(
            DeleteAppointment.receive(context),
            /did not delete 1 of 1 appointment\(s\): 999: INVALID_DATA invalid id/
        );
    });

    it('requires an appointment ID', async () => {
        const client = sinon.stub();
        await assert.rejects(DeleteAppointment.receive(contextFor(' , ', client)), /Appointment ID is required/);
        assert(client.notCalled);
    });

    it('refuses more than 100 IDs', async () => {
        const client = sinon.stub();
        const ids = Array.from({ length: 101 }, (_, i) => String(i + 1)).join(',');
        await assert.rejects(DeleteAppointment.receive(contextFor(ids, client)), /at most 100/);
        assert(client.notCalled);
    });
});

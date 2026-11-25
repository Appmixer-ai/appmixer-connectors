'use strict';

const assert = require('assert');
const path = require('path');
const { createMockContext } = require('../utils');

const CONNECTOR = path.join(__dirname, '../../src/appmixer/gohighlevel');
const component = name => require(path.join(CONNECTOR, 'core', name, `${name}.js`));

const API = 'https://services.leadconnectorhq.com';

const contextFor = content => {
    const context = createMockContext();
    context.auth = { accessToken: 'pit-test', locationId: 'loc1' };
    context.messages = { in: { content } };
    context.httpRequest.resolves({ status: 200, headers: {}, data: { succeeded: true } });
    return context;
};

const lastRequest = context => context.httpRequest.lastCall.args[0];

describe('appmixer.gohighlevel appointments', function() {

    describe('DeleteAppointment', () => {

        it('deletes the calendar event and sends an empty object', async () => {
            const context = contextFor({ appointmentId: 'appt1' });
            await component('DeleteAppointment').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.method, 'DELETE');
            assert.strictEqual(req.url, `${API}/calendars/events/appt1`);
            assert.strictEqual(req.headers.Authorization, 'Bearer pit-test');
            assert.strictEqual(req.headers.Version, '2021-07-28');
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{}, 'out']);
        });

        it('requires the appointment ID', async () => {
            const context = contextFor({});
            await assert.rejects(component('DeleteAppointment').receive(context), /Appointment ID is required/);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });
    });

    describe('UpdateAppointment', () => {

        it('sends only the filled-in fields and an empty object', async () => {
            const context = contextFor({
                appointmentId: 'appt1',
                appointmentStatus: 'confirmed',
                title: 'Renamed',
                address: '',
                assignedUserId: null
            });
            await component('UpdateAppointment').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.method, 'PUT');
            assert.strictEqual(req.url, `${API}/calendars/events/appointments/appt1`);
            assert.strictEqual(req.headers.Version, '2021-07-28');
            assert.deepStrictEqual(req.data, { appointmentStatus: 'confirmed', title: 'Renamed' });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{}, 'out']);
        });

        it('requires the appointment ID and at least one field', async () => {
            await assert.rejects(component('UpdateAppointment').receive(contextFor({ title: 'x' })), /Appointment ID is required/);
            await assert.rejects(component('UpdateAppointment').receive(contextFor({ appointmentId: 'appt1' })), /at least one field/);
        });
    });
});

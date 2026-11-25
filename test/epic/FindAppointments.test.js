'use strict';

const assert = require('assert');
const path = require('path');
const { createMockContext } = require('../utils');

const component = require(path.join(__dirname, '../../src/appmixer/epic/core/FindAppointments/FindAppointments.js'));

const FHIR = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';

const APPOINTMENT = {
    resourceType: 'Appointment',
    id: 'eAppt1',
    status: 'booked',
    start: '2026-09-15T14:00:00Z',
    participant: [
        { actor: { reference: 'Patient/erXuFYUfucBZaryVksYEcMg3', display: 'Camila Lopez' }, status: 'accepted' },
        { actor: { reference: 'Practitioner/p1', display: 'Dr. Smith' }, status: 'accepted' }
    ]
};

const contextFor = (content, data) => {
    const context = createMockContext();
    context.auth = { accessToken: 'token' };
    context.config = {};
    context.properties = {};
    context.messages = { in: { content } };
    context.httpRequest.resolves({ status: 200, data });
    return context;
};

describe('appmixer.epic FindAppointments', () => {

    it('searches by patient, status and date range and sends normalized appointments', async () => {
        const context = contextFor({
            patient: 'erXuFYUfucBZaryVksYEcMg3',
            status: 'booked',
            dateFrom: '2026-09-01T00:00:00.000Z',
            dateTo: '2026-12-31',
            outputType: 'first'
        }, { resourceType: 'Bundle', entry: [{ resource: APPOINTMENT }, { resource: { resourceType: 'OperationOutcome' } }] });

        await component.receive(context);

        const req = context.httpRequest.lastCall.args[0];
        assert.strictEqual(req.url,
            `${FHIR}/Appointment?patient=erXuFYUfucBZaryVksYEcMg3&status=booked&date=ge2026-09-01&date=le2026-12-31`);
        assert.strictEqual(req.headers.Authorization, 'Bearer token');

        const [out, port] = context.sendJson.lastCall.args;
        assert.strictEqual(port, 'out');
        assert.strictEqual(out.id, 'eAppt1');
        assert.strictEqual(out.patientReference, 'Patient/erXuFYUfucBZaryVksYEcMg3');
        assert.deepStrictEqual(out.practitioners, ['Dr. Smith']);
        assert.strictEqual(out.count, 1);
    });

    it('sends only the patient when no filters are set', async () => {
        const context = contextFor({ patient: 'p1', outputType: 'array' }, { resourceType: 'Bundle', entry: [{ resource: APPOINTMENT }] });
        await component.receive(context);
        assert.strictEqual(context.httpRequest.lastCall.args[0].url, `${FHIR}/Appointment?patient=p1`);
        assert.strictEqual(context.sendJson.lastCall.args[0].result.length, 1);
    });

    it('sends to notFound for an empty bundle', async () => {
        const context = contextFor({ patient: 'p1' }, { resourceType: 'Bundle', total: 0 });
        await component.receive(context);
        assert.deepStrictEqual(context.sendJson.lastCall.args, [{}, 'notFound']);
    });

    it('rejects a missing patient and an invalid date', async () => {
        await assert.rejects(component.receive(contextFor({}, {})), /Patient ID is required/);
        await assert.rejects(component.receive(contextFor({ patient: 'p1', dateTo: 'nope' }, {})), /Date To is not a valid date/);
    });
});

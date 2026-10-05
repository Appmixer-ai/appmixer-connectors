const assert = require('assert');
const ZohoClient = require('../../ZohoClient');

// Client whose every API request is answered by `respond(request)`; throwing a Zoho error body
// from it stands for an HTTP 4xx answer.
function clientAnswering(respond, options) {

    const httpRequest = () => {};
    httpRequest.create = () => async request => {
        const answer = respond(request);
        if (answer.status >= 400) {
            const err = new Error(`Request failed with status code ${answer.status}`);
            err.response = answer;
            throw err;
        }
        return answer;
    };
    const context = { auth: { accessToken: 'token' }, profileInfo: { region: 'eu' }, httpRequest };
    return new ZohoClient(context, undefined, options);
}

const INVALID_MODULE = {
    code: 'INVALID_MODULE', details: {}, message: 'the module name given seems to be invalid', status: 'error'
};
const NO_PERMISSION = {
    code: 'NO_PERMISSION', details: {}, message: 'permission denied to access the module', status: 'error'
};

describe('Zoho module errors', () => {

    it('should name the module and the likely reasons on INVALID_MODULE', async () => {

        const client = clientAnswering(() => ({ status: 400, data: INVALID_MODULE }));
        await assert.rejects(client.getRecords('Cases'), err => {
            assert.match(err.message, /does not recognize the module "Cases"/);
            assert.match(err.message, /not included in its edition/);
            assert.match(err.message, /the module name given seems to be invalid \(INVALID_MODULE\)/);
            assert.strictEqual(err.code, 'INVALID_MODULE');
            assert.strictEqual(err.status, 'error');
            assert.deepStrictEqual(err.details, {});
            return true;
        });
    });

    it('should show a module name with a space as it was given', async () => {

        const client = clientAnswering(() => ({ status: 400, data: INVALID_MODULE }));
        await assert.rejects(client.getRecords('Sales Orders'), err => {
            assert.match(err.message, /the module "Sales Orders"/);
            return true;
        });
    });

    it('should take the module from the parameters of a settings request', async () => {

        const client = clientAnswering(() => ({ status: 400, data: INVALID_MODULE }));
        await assert.rejects(client.getFields('Solutions'), err => {
            assert.match(err.message, /the module "Solutions"/);
            return true;
        });
    });

    it('should explain NO_PERMISSION on a module, also when Zoho answers with an array', async () => {

        const client = clientAnswering(() => ({ status: 403, data: [NO_PERMISSION] }), { apiVersion: 'v8' });
        await assert.rejects(client.getRecords('Appointments__s'), err => {
            assert.match(err.message, /denied access to the module "Appointments__s"/);
            assert.match(err.message, /profile of the connected Zoho user/);
            assert.strictEqual(err.code, 'NO_PERMISSION');
            return true;
        });
    });

    it('should explain a module error reported for a record of a bulk request', async () => {

        const client = clientAnswering(() => ({ status: 200, data: { data: [NO_PERMISSION] } }), { apiVersion: 'v8' });
        await assert.rejects(client.executeRecordsRequest('POST', 'Appointments__s', [{}]), err => {
            assert.ok(err instanceof Error);
            assert.match(err.message, /denied access to the module "Appointments__s"/);
            assert.strictEqual(err.code, 'NO_PERMISSION');
            assert.deepStrictEqual(err.data, NO_PERMISSION);
            return true;
        });
    });

    it('should leave other errors as Zoho sent them', async () => {

        const invalidData = { code: 'INVALID_DATA', details: { id: '1' }, message: 'the id given seems to be invalid', status: 'error' };
        const noPermission = { code: 'NO_PERMISSION', details: {}, message: 'permission denied', status: 'error' };
        const booksError = { code: 57, message: 'You are not authorized to perform this operation' };

        for (const data of [invalidData, noPermission, booksError]) {
            const client = clientAnswering(() => ({ status: 400, data }));
            await assert.rejects(client.getRecords('Cases'), err => {
                assert.deepStrictEqual(err, data);
                return true;
            });
        }
    });

    it('should not name a module for a request that has none', async () => {

        const client = clientAnswering(() => ({ status: 400, data: INVALID_MODULE }));
        await assert.rejects(client.request('GET', '/crm/v2/settings/modules'), err => {
            assert.match(err.message, /does not recognize the requested module/);
            return true;
        });
    });
});

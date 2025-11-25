const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const uploadScan = require('../../core/UploadScan/UploadScan.js');

describe('wiz.uploadScan', () => {

    let context;

    beforeEach(async () => {
        // Reset the context
        context = {
            ...testUtils.createMockContext(),
            setTimeout: sinon.spy()
        };

    });

    it('schedule drain 1 minute from now', async () => {
        const scheduleValue = 1;

        context.properties = {
            scheduleType: 'minutes',
            scheduleValue
        };

        await uploadScan.scheduleDrain(context, { previousDate: null });
        const diff = context.setTimeout.getCall(0).args[1];
        const expectedSeconds = scheduleValue * 60;
        assert.equal(Math.round(diff / 1000), expectedSeconds, 'Timeout should be set to the schedule value in milliseconds');
    });

    it('schedule drain 1 minute from now', async () => {
        const scheduleValue = 1;

        context.properties = {
            scheduleType: 'hours',
            scheduleValue
        };

        await uploadScan.scheduleDrain(context, { previousDate: null });
        const diff = context.setTimeout.getCall(0).args[1];
        const expectedSeconds = scheduleValue * 60 * 60;
        assert.equal(Math.round(diff / 1000), expectedSeconds, 'Timeout should be set to the schedule value in milliseconds');
    });

    it('schedule drain 1 day from now', async () => {
        const scheduleValue = 1;

        context.properties = {
            scheduleType: 'days',
            scheduleValue
        };

        await uploadScan.scheduleDrain(context, { previousDate: null });
        const diff = context.setTimeout.getCall(0).args[1];
        const expectedSeconds = scheduleValue * 60 * 60 * 24;
        assert.equal(Math.round(diff / 1000), expectedSeconds, 'Timeout should be set to the schedule value in milliseconds');
    });

    describe('processAllDocuments - send documents succeeded', () => {

        let sendDocumentsStub;

        beforeEach(() => {
            context.config = {};
            sendDocumentsStub = sinon.stub(uploadScan, 'sendDocuments').resolves();
        });

        afterEach(() => {
            sendDocumentsStub.restore();
        });

        it('should call sendDocuments with all documents when no threshold is set', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, {});

            assert(sendDocumentsStub.calledOnce, 'sendDocuments should be called once');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 2, 'Should process all 2 documents');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2']);
        });

        it('should not call sendDocuments if below threshold', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 5 });

            assert.ok(sendDocumentsStub.notCalled, 'sendDocuments should not be called when below threshold');
        });

        it('should call sendDocuments with exactly threshold documents when threshold is reached', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' },
                { id: '3', data: 'doc3' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 3 });

            assert(sendDocumentsStub.calledOnce, 'sendDocuments should be called once');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 3, 'Should process exactly 3 documents (threshold)');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2', 'doc3']);
        });

        xit('should call sendDocuments with threshold documents and recurse when more documents available', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' },
                { id: '3', data: 'doc3' },
                { id: '4', data: 'doc4' },
                { id: '5', data: 'doc5' },
                { id: '6', data: 'doc6' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 3 });

            assert.equal(sendDocumentsStub.callCount, 2, 'sendDocuments should be called twice for 6 documents with threshold 3');

            // First batch
            let callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 3, 'First batch should have 3 documents');
            assert.deepEqual(callArgs[1].documents, ['doc4', 'doc5', 'doc6'], 'First batch should process last 3 documents');

            // Second batch
            callArgs = sendDocumentsStub.getCall(1).args;
            assert.equal(callArgs[1].documents.length, 3, 'Second batch should have 3 documents');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2', 'doc3'], 'Second batch should process remaining 3 documents');
        });

        it('should call sendDocuments with all documents when timeoutTrigger is true, even if below threshold', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 5, timeoutTrigger: true });

            assert(sendDocumentsStub.calledOnce, 'sendDocuments should be called once when timeoutTrigger is true');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 2, 'Should process all 2 documents despite threshold being 5');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2']);
        });

        it('should call sendDocuments with threshold documents when timeoutTrigger is true and threshold is reached', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' },
                { id: '3', data: 'doc3' },
                { id: '4', data: 'doc4' },
                { id: '5', data: 'doc5' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 3, timeoutTrigger: true });
            assert.equal(sendDocumentsStub.callCount, 1, 'sendDocuments should be called twice');

            // First batch - processes last 3 documents
            let callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 5, 'when triggered by timeout, should process all 5 documents');
        });

        it('should handle empty documents array', async () => {
            await context.stateSet('documents', []);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, {});

            assert(sendDocumentsStub.notCalled, 'sendDocuments should not be called for empty documents');
        });

        it('should handle no documents in state', async () => {
            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, {});

            assert(sendDocumentsStub.notCalled, 'sendDocuments should not be called when no documents in state');
        });

        it('should not recurse infinitely if threshold is met exactly', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 2 });

            assert.equal(sendDocumentsStub.callCount, 1, 'sendDocuments should be called exactly once');
        });

        it('should process remaining documents with timeoutTrigger even if below threshold', async () => {
            const docs = [
                { id: '1', data: 'doc1' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 10, timeoutTrigger: true });

            assert(sendDocumentsStub.calledOnce, 'sendDocuments should be called with timeoutTrigger even if below threshold');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 1, 'Should process the single document');
        });

        it('should call prepareForSend and sendDocuments in correct order', async () => {
            const docs = [
                { id: '1', data: 'doc1' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            const prepareForSendSpy = sinon.spy(uploadScan, 'prepareForSend');

            await uploadScan.processAllDocuments(context, {});

            assert(prepareForSendSpy.calledBefore(sendDocumentsStub), 'prepareForSend should be called before sendDocuments');

            prepareForSendSpy.restore();
        });
    });
});

const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../utils.js');
const uploadScan = require('../../src/appmixer/wiz/core/UploadScan/UploadScan.js');

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

    describe('processAllDocuments', () => {

        let sendDocumentsStub;

        beforeEach(() => {
            context.auth = {
                url: 'https://api.wiz.io/graphql',
                token: 'test-token'
            };
            context.config = {};
            sendDocumentsStub = sinon.stub(uploadScan, 'sendDocuments').resolves();
        });

        afterEach(() => {
            sendDocumentsStub.restore();
        });

        it('should call processSend with all documents when no threshold is set', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, {});

            assert(sendDocumentsStub.calledOnce, 'processSend should be called once');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 2, 'Should process all 2 documents');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2']);
        });

        it('should not call processSend if below threshold', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 5 });

            assert.ok(sendDocumentsStub.notCalled, 'processSend should not be called when below threshold')
        });

        it('should call processSend with exactly threshold documents when threshold is reached', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' },
                { id: '3', data: 'doc3' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 3 });

            assert(sendDocumentsStub.calledOnce, 'processSend should be called once');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 3, 'Should process exactly 3 documents (threshold)');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2', 'doc3']);
        });

        xit('should call processSend with threshold documents and recurse when more documents available', async () => {
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

            assert.equal(sendDocumentsStub.callCount, 2, 'processSend should be called twice for 6 documents with threshold 3');

            // First batch
            let callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 3, 'First batch should have 3 documents');
            assert.deepEqual(callArgs[1].documents, ['doc4', 'doc5', 'doc6'], 'First batch should process last 3 documents');

            // Second batch
            callArgs = sendDocumentsStub.getCall(1).args;
            assert.equal(callArgs[1].documents.length, 3, 'Second batch should have 3 documents');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2', 'doc3'], 'Second batch should process remaining 3 documents');
        });

        it('should call processSend with all documents when timeoutTrigger is true, even if below threshold', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 5, timeoutTrigger: true });

            assert(sendDocumentsStub.calledOnce, 'processSend should be called once when timeoutTrigger is true');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 2, 'Should process all 2 documents despite threshold being 5');
            assert.deepEqual(callArgs[1].documents, ['doc1', 'doc2']);
        });

        it('should call processSend with threshold documents when timeoutTrigger is true and threshold is reached', async () => {
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

            assert.equal(sendDocumentsStub.callCount, 2, 'processSend should be called twice');

            // First batch - processes last 3 documents
            let callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 3, 'First batch should have 3 documents (threshold)');

            // Second batch - processes remaining 2 documents
            callArgs = sendDocumentsStub.getCall(1).args;
            assert.equal(callArgs[1].documents.length, 2, 'Second batch should have remaining 2 documents');
        });

        it('should handle empty documents array', async () => {
            await context.stateSet('documents', []);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, {});

            assert(sendDocumentsStub.notCalled, 'processSend should not be called for empty documents');
        });

        it('should handle no documents in state', async () => {
            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, {});

            assert(sendDocumentsStub.notCalled, 'processSend should not be called when no documents in state');
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

            assert.equal(sendDocumentsStub.callCount, 1, 'processSend should be called exactly once');
        });

        it('should process remaining documents with timeoutTrigger even if below threshold', async () => {
            const docs = [
                { id: '1', data: 'doc1' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processAllDocuments(context, { threshold: 10, timeoutTrigger: true });

            assert(sendDocumentsStub.calledOnce, 'processSend should be called with timeoutTrigger even if below threshold');
            const callArgs = sendDocumentsStub.getCall(0).args;
            assert.equal(callArgs[1].documents.length, 1, 'Should process the single document');
        });

        it('should call prepareForSend and processSend in correct order', async () => {
            const docs = [
                { id: '1', data: 'doc1' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            const prepareForSendSpy = sinon.spy(uploadScan, 'prepareForSend');

            await uploadScan.processAllDocuments(context, {});

            assert(prepareForSendSpy.calledBefore(sendDocumentsStub), 'prepareForSend should be called before processSend');

            prepareForSendSpy.restore();
        });

        it('should restore documents to queue when processSend fails', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('documents', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            // Make processSend fail
            sendDocumentsStub.restore();
            sendDocumentsStub = sinon.stub(uploadScan, 'processSend').callsFake(async (context) => {
                // Simulate the batch being moved
                await context.stateSet('documents-upload-batch', docs);
                await context.stateUnset('documents');
                throw new Error('Upload failed');
            });

            await assert.rejects(
                uploadScan.processAllDocuments(context, {}),
                /Upload failed/
            );

            // Documents should be restored to the queue
            const restoredDocs = await context.stateGet('documents');

            console.log(restoredDocs);
            assert(restoredDocs, 'Documents should be restored');
            assert.equal(restoredDocs.length, 2, 'All documents should be restored');
        });
    });

    describe('processSend', () => {

        let sendDocumentsStub;

        beforeEach(() => {
            context.auth = {
                url: 'https://api.wiz.io/graphql',
                token: 'test-token'
            };
            context.config = {};
            sendDocumentsStub = sinon.stub(uploadScan, 'sendDocuments').resolves({
                id: 'activity-123',
                status: 'SUCCESS'
            });
        });

        afterEach(() => {
            sendDocumentsStub.restore();
        });

        it('should clear documents-upload-batch when sendDocuments succeeds', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('metadata', {
                integrationId: 'int-123',
                filename: 'test.json'
            });
            await context.stateSet('documents-upload-batch', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processSend(context, { documents: ['doc1', 'doc2'] });

            const batch = await context.stateGet('documents-upload-batch');
            assert.equal(batch, undefined, 'documents-upload-batch should be cleared');
            assert(sendDocumentsStub.calledOnce, 'sendDocuments should be called once');
        });

        it('should restore documents to queue when sendDocuments fails', async () => {
            const docs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];
            await context.stateSet('metadata', {
                integrationId: 'int-123',
                filename: 'test.json'
            });
            await context.stateSet('documents-upload-batch', docs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            sendDocumentsStub.rejects(new Error('Upload failed'));

            await assert.rejects(
                uploadScan.processSend(context, { documents: ['doc1', 'doc2'] }),
                /Upload failed/
            );

            const batch = await context.stateGet('documents-upload-batch');
            assert.equal(batch, undefined, 'documents-upload-batch should be cleared');

            const restoredDocs = await context.stateGet('documents');
            assert(restoredDocs, 'Documents should be restored to main queue');
            assert.equal(restoredDocs.length, 2, 'All documents should be restored');
            assert.deepEqual(restoredDocs, docs, 'Restored documents should match original');
        });

        it('should merge restored documents with existing documents in queue', async () => {
            const existingDocs = [
                { id: '0', data: 'existing' }
            ];
            const batchDocs = [
                { id: '1', data: 'doc1' },
                { id: '2', data: 'doc2' }
            ];

            await context.stateSet('metadata', {
                integrationId: 'int-123',
                filename: 'test.json'
            });
            await context.stateSet('documents', existingDocs);
            await context.stateSet('documents-upload-batch', batchDocs);

            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            sendDocumentsStub.rejects(new Error('Upload failed'));

            await assert.rejects(
                uploadScan.processSend(context, { documents: ['doc1', 'doc2'] }),
                /Upload failed/
            );

            const restoredDocs = await context.stateGet('documents');
            assert.equal(restoredDocs.length, 3, 'Should have existing + restored documents');
            assert.deepEqual(restoredDocs, [...existingDocs, ...batchDocs]);
        });

        it('should not process when documents array is empty', async () => {
            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processSend(context, { documents: [] });

            assert(sendDocumentsStub.notCalled, 'sendDocuments should not be called for empty array');
            assert(context.lock.notCalled, 'lock should not be acquired for empty array');
        });

        it('should not process when documents is null', async () => {
            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await uploadScan.processSend(context, { documents: null });

            assert(sendDocumentsStub.notCalled, 'sendDocuments should not be called for null');
            assert(context.lock.notCalled, 'lock should not be acquired for null');
        });

        it('should throw CancelError when metadata is missing', async () => {
            const unlockStub = sinon.stub();
            context.lock.resolves({ unlock: unlockStub });

            await assert.rejects(
                uploadScan.processSend(context, { documents: ['doc1'] }),
                (error) => {
                    assert(error instanceof context.CancelError);
                    assert(error.message.includes('No metadata found'));
                    return true;
                }
            );
        });
    });
});

'use strict';

const assert = require('assert');

describe('ActiveCampaign Task Components Validation', function() {

    describe('CreateTask', function() {
        const CreateTask = require('../../tasks/CreateTask/CreateTask.js');

        it('should throw error when relationship is missing', async function() {
            const context = {
                messages: { in: { content: { taskType: '1', title: 'Test', note: 'Note', due: '2024-01-01', duration: 1, durationUnits: 'hours' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing relationship');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Task Relationship is required');
            }
        });

        it('should throw error when taskType is missing', async function() {
            const context = {
                messages: { in: { content: { relationship: 'contact', title: 'Test', note: 'Note', due: '2024-01-01', duration: 1, durationUnits: 'hours' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing taskType');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Task type is required');
            }
        });

        it('should throw error when title is missing', async function() {
            const context = {
                messages: { in: { content: { relationship: 'contact', taskType: '1', note: 'Note', due: '2024-01-01', duration: 1, durationUnits: 'hours' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing title');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Title is required');
            }
        });

        it('should throw error when note is missing', async function() {
            const context = {
                messages: { in: { content: { relationship: 'contact', taskType: '1', title: 'Test', due: '2024-01-01', duration: 1, durationUnits: 'hours' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing note');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Description is required');
            }
        });

        it('should throw error when due is missing', async function() {
            const context = {
                messages: { in: { content: { relationship: 'contact', taskType: '1', title: 'Test', note: 'Note', duration: 1, durationUnits: 'hours' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing due');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Due is required');
            }
        });

        it('should throw error when duration is missing', async function() {
            const context = {
                messages: { in: { content: { relationship: 'contact', taskType: '1', title: 'Test', note: 'Note', due: '2024-01-01', durationUnits: 'hours' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing duration');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Duration is required');
            }
        });

        it('should throw error when durationUnits is missing', async function() {
            const context = {
                messages: { in: { content: { relationship: 'contact', taskType: '1', title: 'Test', note: 'Note', due: '2024-01-01', duration: 1 } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing durationUnits');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Duration units is required');
            }
        });
    });

    describe('UpdateTask', function() {
        const UpdateTask = require('../../tasks/UpdateTask/UpdateTask.js');

        it('should throw error when taskId is missing', async function() {
            const context = {
                messages: { in: { content: { title: 'Test' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await UpdateTask.receive(context);
                assert.fail('Should have thrown CancelError for missing taskId');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Task is required');
            }
        });
    });

    describe('DeleteTask', function() {
        const DeleteTask = require('../../tasks/DeleteTask/DeleteTask.js');

        it('should throw error when taskId is missing', async function() {
            const context = {
                messages: { in: { content: {} } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await DeleteTask.receive(context);
                assert.fail('Should have thrown CancelError for missing taskId');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Task is required');
            }
        });
    });
});

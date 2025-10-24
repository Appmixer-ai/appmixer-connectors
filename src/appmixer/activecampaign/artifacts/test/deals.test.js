'use strict';

const assert = require('assert');

describe('ActiveCampaign Deal Components Validation', function() {

    describe('CreateDeal', function() {
        const CreateDeal = require('../../deals/CreateDeal/CreateDeal.js');

        it('should throw error when contactId is missing', async function() {
            const context = {
                messages: { in: { content: { title: 'Test', owner: '1', stage: '1', value: 100, currency: 'USD' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing contactId');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact is required');
            }
        });

        it('should throw error when title is missing', async function() {
            const context = {
                messages: { in: { content: { contactId: '1', owner: '1', stage: '1', value: 100, currency: 'USD' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing title');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Title is required');
            }
        });

        it('should throw error when owner is missing', async function() {
            const context = {
                messages: { in: { content: { contactId: '1', title: 'Test', stage: '1', value: 100, currency: 'USD' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing owner');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Owner is required');
            }
        });

        it('should throw error when stage is missing', async function() {
            const context = {
                messages: { in: { content: { contactId: '1', title: 'Test', owner: '1', value: 100, currency: 'USD' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing stage');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Stage is required');
            }
        });

        it('should throw error when value is missing', async function() {
            const context = {
                messages: { in: { content: { contactId: '1', title: 'Test', owner: '1', stage: '1', currency: 'USD' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing value');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Deal amount is required');
            }
        });

        it('should throw error when currency is missing', async function() {
            const context = {
                messages: { in: { content: { contactId: '1', title: 'Test', owner: '1', stage: '1', value: 100 } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing currency');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Currency is required');
            }
        });
    });

    describe('UpdateDeal', function() {
        const UpdateDeal = require('../../deals/UpdateDeal/UpdateDeal.js');

        it('should throw error when dealId is missing', async function() {
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
                await UpdateDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing dealId');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Deal is required');
            }
        });
    });

    describe('DeleteDeal', function() {
        const DeleteDeal = require('../../deals/DeleteDeal/DeleteDeal.js');

        it('should throw error when dealId is missing', async function() {
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
                await DeleteDeal.receive(context);
                assert.fail('Should have thrown CancelError for missing dealId');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Deal is required');
            }
        });
    });
});

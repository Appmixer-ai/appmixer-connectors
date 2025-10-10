const assert = require('assert');
const { Readable } = require('stream');
const geminiLib = require('../../lib');

describe('ai.gemini extractBaseModelId', () => {

    it('should extract model ID from valid model name', () => {
        const result = geminiLib.extractBaseModelId('provider/model-name');
        assert.strictEqual(result, 'model-name');
    });

    it('should extract model ID from model name with complex path', () => {
        const result = geminiLib.extractBaseModelId('google/gemini-1.5-flash');
        assert.strictEqual(result, 'gemini-1.5-flash');
    });

    it('should return undefined for model name without slash', () => {
        const result = geminiLib.extractBaseModelId('model-name');
        assert.strictEqual(result, undefined);
    });

    it('should throw error for null model name', () => {
        assert.throws(() => {
            geminiLib.extractBaseModelId(null);
        }, /Invalid model name/);
    });

    it('should throw error for undefined model name', () => {
        assert.throws(() => {
            geminiLib.extractBaseModelId(undefined);
        }, /Invalid model name/);
    });

    it('should throw error for non-string model name', () => {
        assert.throws(() => {
            geminiLib.extractBaseModelId(123);
        }, /Invalid model name/);
    });

    it('should throw error for empty string model name', () => {
        assert.throws(() => {
            geminiLib.extractBaseModelId('');
        }, /Invalid model name/);
    });
});

describe('ai.gemini splitText', () => {

    it('should split text into chunks with default parameters', async () => {
        const text = 'This is a test text that should be split into multiple chunks based on the chunk size and overlap parameters.';
        const result = await geminiLib.splitText(text, 50, 10);

        assert(Array.isArray(result), 'Result should be an array');
        assert(result.length > 1, 'Text should be split into multiple chunks');
        result.forEach(chunk => {
            assert(typeof chunk === 'string', 'Each chunk should be a string');
        });
    });

    it('should handle small text that fits in one chunk', async () => {
        const text = 'Small text';
        const result = await geminiLib.splitText(text, 100, 10);

        assert.strictEqual(result.length, 1, 'Small text should result in one chunk');
        assert.strictEqual(result[0], text, 'Chunk should equal original text');
    });

    it('should handle empty text', async () => {
        const result = await geminiLib.splitText('', 100, 10);

        assert(Array.isArray(result), 'Result should be an array');
        assert.strictEqual(result.length, 0, 'Empty text should result in empty array');
    });

    it('should handle zero chunk overlap', async () => {
        const text = 'This is a test text for zero overlap.';
        const result = await geminiLib.splitText(text, 20, 0);

        assert(Array.isArray(result), 'Result should be an array');
        result.forEach(chunk => {
            assert(chunk.length <= 20 || chunk.split(' ').length <= 2, 'Chunks should respect size limit');
        });
    });
});

describe('ai.gemini splitStream', () => {

    it('should split stream into chunks of specified size', (done) => {
        const inputData = Buffer.from('0123456789abcdefghijklmnopqrstuvwxyz');
        const inputStream = new Readable({
            read() {
                this.push(inputData);
                this.push(null);
            }
        });

        const chunks = [];
        const splitStream = geminiLib.splitStream(inputStream, 10);

        splitStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        splitStream.on('end', () => {
            assert(chunks.length > 1, 'Stream should be split into multiple chunks');
            chunks.forEach((chunk, index) => {
                if (index < chunks.length - 1) {
                    assert.strictEqual(chunk.length, 10, 'Each chunk (except last) should be exactly 10 bytes');
                } else {
                    assert(chunk.length <= 10, 'Last chunk should be 10 bytes or less');
                }
            });

            // Verify that concatenated chunks equal original data
            const concatenated = Buffer.concat(chunks);
            assert(concatenated.equals(inputData), 'Concatenated chunks should equal original data');
            done();
        });

        splitStream.on('error', done);
    });

    it('should handle small stream that fits in one chunk', (done) => {
        const inputData = Buffer.from('small');
        const inputStream = new Readable({
            read() {
                this.push(inputData);
                this.push(null);
            }
        });

        const chunks = [];
        const splitStream = geminiLib.splitStream(inputStream, 100);

        splitStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        splitStream.on('end', () => {
            assert.strictEqual(chunks.length, 1, 'Small stream should result in one chunk');
            assert(chunks[0].equals(inputData), 'Chunk should equal original data');
            done();
        });

        splitStream.on('error', done);
    });

    it('should handle empty stream', (done) => {
        const inputStream = new Readable({
            read() {
                this.push(null);
            }
        });

        const chunks = [];
        const splitStream = geminiLib.splitStream(inputStream, 10);

        splitStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        splitStream.on('end', () => {
            assert.strictEqual(chunks.length, 0, 'Empty stream should result in no chunks');
            done();
        });

        splitStream.on('error', done);
    });
});

describe('ai.gemini getConnectedToolStartComponents', () => {

    it('should find connected ToolStart components', () => {
        const agentComponentId = 'agent1';
        const flowDescriptor = {
            tool1: {
                type: 'appmixer.ai.agenttools.ToolStart',
                source: {
                    in: {
                        agent1: ['tools']
                    }
                }
            },
            tool2: {
                type: 'appmixer.ai.agenttools.ToolStart',
                source: {
                    in: {
                        agent1: ['tools']
                    }
                }
            },
            other: {
                type: 'other.component',
                source: {
                    in: {
                        agent1: ['data']
                    }
                }
            }
        };

        const result = geminiLib.getConnectedToolStartComponents(agentComponentId, flowDescriptor);

        assert.strictEqual(Object.keys(result).length, 2, 'Should find 2 connected ToolStart components');
        assert(result.tool1, 'Should include tool1');
        assert(result.tool2, 'Should include tool2');
        assert(!result.other, 'Should not include non-ToolStart component');
    });

    it('should return empty object when no tools connected', () => {
        const agentComponentId = 'agent1';
        const flowDescriptor = {
            other: {
                type: 'other.component',
                source: {
                    in: {
                        agent1: ['data']
                    }
                }
            }
        };

        const result = geminiLib.getConnectedToolStartComponents(agentComponentId, flowDescriptor);

        assert.strictEqual(Object.keys(result).length, 0, 'Should return empty object');
    });

    it('should throw error for non-ToolStart component connected to tools port', () => {
        const agentComponentId = 'agent1';
        const flowDescriptor = {
            wrongTool: {
                type: 'other.component.type',
                source: {
                    in: {
                        agent1: ['tools']
                    }
                }
            }
        };

        assert.throws(() => {
            geminiLib.getConnectedToolStartComponents(agentComponentId, flowDescriptor);
        }, /Component wrongTool is not of type 'ToolStart'/);
    });

    it('should handle components with no sources', () => {
        const agentComponentId = 'agent1';
        const flowDescriptor = {
            isolated: {
                type: 'appmixer.ai.agenttools.ToolStart'
            }
        };

        const result = geminiLib.getConnectedToolStartComponents(agentComponentId, flowDescriptor);

        assert.strictEqual(Object.keys(result).length, 0, 'Should return empty object for isolated components');
    });
});

describe('ai.gemini getFunctionDeclarations', () => {

    it('should handle parameters.ADD with empty object', () => {
        const tools = {
            comp1: {
                config: {
                    properties: {
                        description: 'desc',
                        parameters: {
                            ADD: [
                                { name: 'foo', type: 'string', description: 'desc' },
                                {} // empty object
                            ]
                        }
                    }
                }
            }
        };
        // Should not throw, should skip empty param
        const result = geminiLib.getFunctionDeclarations(tools);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'function_comp1');
        assert.strictEqual(result[0].description, 'desc');
        assert.deepStrictEqual(result[0].parameters.properties.foo, { type: 'string', description: 'desc' });
        // Should not include empty property
        assert.strictEqual(Object.keys(result[0].parameters.properties).length, 1);
    });

    it('should create function declarations for multiple tools', () => {
        const tools = {
            tool1: {
                config: {
                    properties: {
                        description: 'First tool',
                        parameters: {
                            ADD: [
                                { name: 'param1', type: 'string', description: 'First parameter' },
                                { name: 'param2', type: 'number', description: 'Second parameter' }
                            ]
                        }
                    }
                }
            },
            tool2: {
                config: {
                    properties: {
                        description: 'Second tool',
                        parameters: {
                            ADD: [
                                { name: 'param3', type: 'boolean', description: 'Third parameter' }
                            ]
                        }
                    }
                }
            }
        };

        const result = geminiLib.getFunctionDeclarations(tools);

        assert.strictEqual(result.length, 2, 'Should create declarations for both tools');

        const tool1Declaration = result.find(f => f.name === 'function_tool1');
        const tool2Declaration = result.find(f => f.name === 'function_tool2');

        assert(tool1Declaration, 'Should have declaration for tool1');
        assert(tool2Declaration, 'Should have declaration for tool2');

        assert.strictEqual(tool1Declaration.description, 'First tool');
        assert.strictEqual(Object.keys(tool1Declaration.parameters.properties).length, 2);

        assert.strictEqual(tool2Declaration.description, 'Second tool');
        assert.strictEqual(Object.keys(tool2Declaration.parameters.properties).length, 1);
    });

    it('should handle tools with no parameters', () => {
        const tools = {
            simpleTool: {
                config: {
                    properties: {
                        description: 'Tool without parameters'
                    }
                }
            }
        };

        const result = geminiLib.getFunctionDeclarations(tools);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'function_simpleTool');
        assert.strictEqual(result[0].description, 'Tool without parameters');
        assert(!result[0].parameters, 'Should not have parameters property');
    });

    it('should handle tools with empty parameters array', () => {
        const tools = {
            emptyTool: {
                config: {
                    properties: {
                        description: 'Tool with empty parameters',
                        parameters: {
                            ADD: []
                        }
                    }
                }
            }
        };

        const result = geminiLib.getFunctionDeclarations(tools);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'function_emptyTool');
        assert.strictEqual(result[0].description, 'Tool with empty parameters');
        assert(!result[0].parameters, 'Should not have parameters property for empty array');
    });

    it('should handle empty tools object', () => {
        const tools = {};
        const result = geminiLib.getFunctionDeclarations(tools);

        assert.strictEqual(result.length, 0, 'Should return empty array for empty tools');
    });
});

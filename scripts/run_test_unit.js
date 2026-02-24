#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');

const defaultPatterns = [
    'test/**/*.test.js',
    'src/appmixer/**/artifacts/test/**/*.test.js',
    'src/examples/**/artifacts/test/**/*.test.js'
];

const userArgs = process.argv.slice(2);
const coverageMode = userArgs[0] === '--coverage';
const filteredArgs = coverageMode ? userArgs.slice(1) : userArgs;

function isExplicitTestPattern(value) {
    return value.includes('*') || value.endsWith('.test.js') || value.includes('.test.js');
}

function toScopedPattern(value) {
    const normalized = value.replace(/\/$/, '');
    return `${normalized}/**/artifacts/test/**/*.test.js`;
}

const patterns = filteredArgs.length
    ? filteredArgs.map(value => (isExplicitTestPattern(value) ? value : toScopedPattern(value)))
    : defaultPatterns;

const mochaArgs = [
    '--recursive',
    '--exit',
    '--exclude',
    '**/node_modules/**',
    ...patterns
];

const runnerCommand = coverageMode
    ? (process.platform === 'win32' ? 'nyc.cmd' : 'nyc')
    : (process.platform === 'win32' ? 'mocha.cmd' : 'mocha');

const runnerArgs = coverageMode
    ? ['--reporter=lcov', '--reporter=text-summary', 'mocha', ...mochaArgs]
    : mochaArgs;

const child = spawn(runnerCommand, runnerArgs, {
    stdio: 'inherit'
});

child.on('exit', code => {
    process.exit(code ?? 1);
});

child.on('error', err => {
    console.error('Failed to run mocha:', err.message);
    process.exit(1);
});

const archiver = require('archiver');
const fs = require('fs');

const file = 'blocking-ip-shared-flow.zip';
const output = fs.createWriteStream(file);
const archive = archiver('zip');

output.on('close', () => {
    console.log(`✅ Archive created: ${file} (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);
archive.directory('artifacts', false);
archive.finalize();

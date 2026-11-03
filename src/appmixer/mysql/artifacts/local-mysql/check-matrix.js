'use strict';

/**
 * Runs the connection test matrix from Appmixer-ai/appmixer-components#2952 against the local servers
 * started by local-mysql.sh, using the connector's own connect() helper (common.js), so the cases
 * exercise exactly the options the components and auth.js build.
 *
 * usage:  node check-matrix.js [host84 port84 [host80 port80]]
 *   - with the ngrok addresses (from `local-mysql.sh tunnel-status`) more cases run through the
 *     tunnels, which is the only way to exercise the hostname check of the CA case on a non-local host.
 *   - OLD_MYSQL_DRIVER=/path/to/node_modules/mysql  adds a column-by-column comparison of
 *     `SELECT * FROM items` between the old `mysql` driver and mysql2 (on the 8.0 server, the old
 *     driver cannot log in to 8.4). Differences are what the 3.0.0 changelog has to list.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const common = require('../../common');

const root = process.env.MYSQL_TEST_DIR || path.join(os.homedir(), 'mysql-test');
const pw = fs.readFileSync(path.join(root, 'password'), 'utf8').trim();
const ca = fs.readFileSync(path.join(root, 'certs/ca.pem'), 'utf8');
const wrongCa = fs.readFileSync(path.join(root, 'certs/wrong-ca.pem'), 'utf8');
const [ngrokHost, ngrokPort, ngrokHost80, ngrokPort80] = process.argv.slice(2);

const base84 = { dbUser: 'appmixer', dbHost: '127.0.0.1', dbPort: process.env.PORT_84 || '3307', database: 'appmixer_test', dbPassword: pw };
const base80 = { dbUser: 'appmixer', dbHost: '127.0.0.1', dbPort: process.env.PORT_80 || '3308', database: 'appmixer_test', dbPassword: pw };

const cases = [
    ['84-tls    SSL on, no CA', { ...base84, useSsl: 'true' }, 'ok'],
    ['84-tls    SSL on, correct CA (127.0.0.1)', { ...base84, useSsl: 'true', sslCa: ca }, 'ok'],
    ['84-tls    CA only, Use SSL left at No (localhost)', { ...base84, dbHost: 'localhost', useSsl: 'false', sslCa: ca }, 'ok'],
    ['84-tls    SSL on, wrong CA', { ...base84, useSsl: 'true', sslCa: wrongCa }, 'fail'],
    ['84-tls    SSL off', { ...base84, useSsl: 'false' }, 'fail'],
    ['80-plain  no SSL fields (account created before 3.0.0)', { ...base80 }, 'ok'],
    ['80-plain  SSL on, no CA (auto-generated server certificate)', { ...base80, useSsl: 'true' }, 'ok']
];
if (ngrokHost) {
    cases.push([`84-tls    via ngrok ${ngrokHost}:${ngrokPort}, SSL on, correct CA (hostname check)`,
        { ...base84, dbHost: ngrokHost, dbPort: ngrokPort, useSsl: 'true', sslCa: ca }, 'ok']);
    cases.push([`84-tls    via ngrok ${ngrokHost}:${ngrokPort}, SSL on, no CA`,
        { ...base84, dbHost: ngrokHost, dbPort: ngrokPort, useSsl: 'true' }, 'ok']);
    cases.push([`84-tls    via ngrok ${ngrokHost}:${ngrokPort}, SSL off`,
        { ...base84, dbHost: ngrokHost, dbPort: ngrokPort, useSsl: 'false' }, 'fail']);
}
if (ngrokHost80) {
    cases.push([`80-plain  via ngrok ${ngrokHost80}:${ngrokPort80}, no SSL fields`,
        { ...base80, dbHost: ngrokHost80, dbPort: ngrokPort80 }, 'ok']);
}

function query(conn, sql) {
    return new Promise((resolve, reject) => conn.query(sql, (err, rows) => (err ? reject(err) : resolve(rows))));
}

async function runCases() {
    let unexpected = 0;
    for (const [label, auth, expect] of cases) {
        let conn;
        try {
            conn = await common.connect(auth);
            const [info] = await query(conn, 'SELECT VERSION() v, CURRENT_USER() u');
            const [cipher] = await query(conn, "SHOW STATUS LIKE 'Ssl_cipher'");
            if (expect !== 'ok') unexpected++;
            console.log(`${expect === 'ok' ? 'PASS' : 'FAIL'}  ${label}`);
            console.log(`      connected: ${info.v}  user=${info.u}  cipher=${cipher.Value || '(none)'}`);
        } catch (err) {
            if (expect !== 'fail') unexpected++;
            console.log(`${expect === 'fail' ? 'PASS' : 'FAIL'}  ${label}`);
            console.log(`      rejected: ${err.code || ''} ${err.message.split('\n')[0]}`);
        } finally {
            if (conn) conn.end();
        }
    }
    return unexpected;
}

async function compareDrivers() {
    const oldDriverPath = process.env.OLD_MYSQL_DRIVER;
    if (!oldDriverPath) return;
    console.log('\n--- old `mysql` driver vs mysql2 on 80-plain: SELECT * FROM items ORDER BY id');
    const newConn = await common.connect(base80);
    const newRows = await query(newConn, 'SELECT * FROM items ORDER BY id');
    newConn.end();
    const oldDriver = require(oldDriverPath);
    const oldConn = oldDriver.createConnection({
        user: base80.dbUser, host: base80.dbHost, port: Number(base80.dbPort), database: base80.database,
        password: base80.dbPassword, dateStrings: true, supportBigNumbers: true
    });
    const oldRows = await query(oldConn, 'SELECT * FROM items ORDER BY id');
    oldConn.end();
    const show = v => (Buffer.isBuffer(v) ? `Buffer<${v.toString('hex')}>` : `${typeof v}:${JSON.stringify(v)}`);
    let differences = 0;
    newRows.forEach((row, i) => {
        console.log(`row ${row.id}`);
        for (const col of Object.keys(row)) {
            const o = show(oldRows[i][col]);
            const n = show(row[col]);
            if (o !== n) differences++;
            console.log(`   ${col.padEnd(11)} old=${o.padEnd(42)} new=${n}${o !== n ? '   <-- differs' : ''}`);
        }
    });
    console.log(differences === 0 ? 'no differences between the drivers' : `${differences} differing cell(s)`);
}

(async () => {
    const unexpected = await runCases();
    await compareDrivers();
    console.log(`\n${unexpected === 0 ? 'all matrix cases behaved as expected' : `${unexpected} matrix case(s) unexpected`}`);
    process.exit(unexpected === 0 ? 0 : 1);
})().catch(err => {
    console.error(err);
    process.exit(2);
});

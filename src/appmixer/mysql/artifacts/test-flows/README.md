# MySQL — testing

Six E2E flows cover every component of the connector. They were written for 3.0.0
(Appmixer-ai/appmixer-components#2952: `mysql` → `mysql2`, SSL/TLS account fields,
MySQL 8.4 / `caching_sha2_password`).

| Flow | Covers |
|---|---|
| `test-flow-query.json` | Query |
| `test-flow-list-tables.json` | ListTables (needs at least one table in the database) |
| `test-flow-new-row.json` | NewRow |
| `test-flow-updated-row.json` | UpdatedRow (+ UpdatedRowOutput) |
| `test-flow-deleted-row.json` | DeletedRow |
| `test-flow-watch-rows.json` | WatchRows |

The trigger flows provoke their own change and fire on the second poll after start, so the
`AfterAll` timeout is 420 s. Give the runner a matching window.

## There is no hosted test database

The `admin` account on AWS RDS (`database-for-connector-testing-1…eu-west-1`) that the E2E
account on `dev-automated-00001` was bound to no longer exists: its hostname stopped resolving
in DNS on 2026-11-02. Until a hosted server is set up again, testing runs against **two local
MySQL servers** described below, exposed through a tunnel when a remote Appmixer instance has
to reach them. Credentials: `creds show mysql` (`accounts.local-84-tls`, `accounts.local-80-plain`,
`auth`) in appmixer-test-credentials.

## Local test servers (`../local-mysql/`)

`local-mysql.sh` builds and runs two servers from Homebrew packages, side by side with whatever
other MySQL the machine already runs (own ports, data directories and sockets under
`~/mysql-test`). It was written for macOS; the paths of the binaries are overridable through
`MYSQLD_84`, `MYSQLD_80`, `MYSQL_CLIENT`.

| Name | Version | Port | Transport | Test user `appmixer` | Purpose |
|---|---|---|---|---|---|
| `84-tls` | 8.4.13 | 3307 | `require_secure_transport=ON`, own CA | `caching_sha2_password`, `REQUIRE SSL` | the customer's setup; every SSL case of the test plan |
| `80-plain` | 8.0.46 | 3308 | TLS optional (auto-generated cert) | `mysql_native_password` | regression for accounts created before 3.0.0, old-vs-new driver comparison |

```bash
brew install mysql@8.4 mysql@8.0          # once
./local-mysql.sh setup                     # certs, init, start, users, schema — idempotent
./local-mysql.sh status | start | stop     # the servers do not start at login
./local-mysql.sh sql 84-tls                # root over the unix socket, no password
./local-mysql.sh print-auth 84-tls         # account JSON for `appmixer test auth validate` / verify
```

- Both servers hold database `appmixer_test` with table `items` (`schema.sql`): one column of
  each type whose representation differs between drivers (JSON, DECIMAL, BIGINT above 2^53, BIT,
  DATE, DATETIME, TIMESTAMP) plus `created_at` / `updated_at` for the triggers.
- The password is generated once into `~/mysql-test/password` (same for both servers) and is
  stored in appmixer-test-credentials.
- `~/mysql-test/certs/ca.pem` is the CA of `84-tls`; `wrong-ca.pem` is an unrelated CA for the
  "wrong CA" case. The server certificate has SANs for `localhost`, `127.0.0.1` and
  `*.tcp.<region>.ngrok.io`, so the CA case passes both locally and through the tunnel.

### Reaching the servers from an Appmixer instance

```bash
./local-mysql.sh tunnel          # both servers as ngrok tcp endpoints in ONE agent session
./local-mysql.sh tunnel-status   # mysql-84-tls  7.tcp.eu.ngrok.io:29849  ->  localhost:3307
                                 # mysql-80-plain  6.tcp.eu.ngrok.io:19516  ->  localhost:3308
```

Put that host and port into the `appmixer:mysql` account on the instance (User `appmixer`,
Database `appmixer_test`, Use SSL `Yes`, optionally the CA). On the free ngrok plan the address
can change on every start, so check `tunnel-status` after each restart of the tunnel and edit the
account if needed.

Two things that do not work on the free plan: a second agent (`ngrok tcp 3308` next to a running
agent fails with `ERR_NGROK_108`, hence the single session with two endpoints), and an **HTTP
endpoint** (`ngrok http 3307`, `xxx.ngrok-free.app`): MySQL is not HTTP, ngrok answers
`ERR_NGROK_3004` and the client reports `PROTOCOL_CONNECTION_LOST` after about five seconds.

## Connection test matrix (components#2952 test plan)

`check-matrix.js` runs the matrix with the connector's own `connect()` from `common.js`, so it
exercises exactly the options auth.js and the components build. Run it from
`artifacts/local-mysql/`; pass the ngrok host and port to add the tunnel cases, and point
`OLD_MYSQL_DRIVER` at an installed copy of the old `mysql` package to get the column-by-column
driver comparison:

```bash
node check-matrix.js 7.tcp.eu.ngrok.io 29849 6.tcp.eu.ngrok.io 19516   # 84-tls, then 80-plain
OLD_MYSQL_DRIVER=/path/to/node_modules/mysql node check-matrix.js
```

Result on 2026-11-02 (PR head `36b2a05`):

| Case | Server | Expected | Seen |
|---|---|---|---|
| Use SSL Yes, no CA | 84-tls | connects | connects, `TLS_AES_256_GCM_SHA384` |
| Use SSL Yes, correct CA | 84-tls, `127.0.0.1` and `localhost` | connects | connects |
| CA filled, Use SSL left at No | 84-tls | connects (CA alone turns SSL on) | connects |
| Use SSL Yes, wrong CA | 84-tls | certificate error | `HANDSHAKE_SSL_ERROR self-signed certificate in certificate chain` |
| Use SSL No | 84-tls | fails as the customer sees today | `ER_ACCESS_DENIED_ERROR Access denied for user 'appmixer'@'localhost' (using password: YES)` |
| No SSL fields (pre-3.0.0 account) | 80-plain | connects | connects, no cipher, `mysql_native_password` |
| Use SSL Yes, no CA | 80-plain | connects | connects |
| Use SSL Yes, correct CA, through ngrok (`7.tcp.eu.ngrok.io`) | 84-tls | connects (hostname check against SAN) | connects |
| Use SSL Yes, no CA, through ngrok | 84-tls | connects | connects |
| Use SSL No, through ngrok | 84-tls | fails | `ER_ACCESS_DENIED_ERROR` |
| No SSL fields, through ngrok (`6.tcp.eu.ngrok.io`) | 80-plain | connects | connects, no cipher |

A server that requires TLS refuses a plain connection with `ER_ACCESS_DENIED_ERROR` when the
*user* has `REQUIRE SSL` (as here), and with `ER_SECURE_TRANSPORT_REQUIRED` when only
`require_secure_transport=ON` is set. Both are "SSL off: fails".

### Old driver vs mysql2

With the options the connector sets (`dateStrings`, `supportBigNumbers`, `jsonStrings`,
`decimalNumbers`) the two drivers returned **identical values and types** for every column of
`items` on the 8.0 server: JSON as string, DECIMAL as number, BIGINT above 2^53 as string, BIT as
Buffer, DATE/DATETIME/TIMESTAMP as strings, NULLs as null. There is nothing to list in the
changelog for these types. (Query previously connected without `dateStrings` /
`supportBigNumbers`; that difference is already in the changelog.)

### Hostname verification with a CA

With a CA filled the connector sets `rejectUnauthorized: true` and leaves Node's default
hostname check on, so the server certificate must name the host the account connects to
(SAN). Managed services (RDS, Aiven, Cloud SQL) issue such certificates; a MySQL server with
its auto-generated certificate (CN `MySQL_Server_…_Auto_Generated_Server_Certificate`, no SAN)
fails the CA case with `ERR_TLS_CERT_ALTNAME_INVALID` even though the CA is right. Use the
"Use SSL" switch without a CA for those, or a server certificate with a proper SAN.

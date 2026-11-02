-- Test schema for the appmixer.mysql connector. Loaded into every local test server by local-mysql.sh.
-- The `items` table carries one column of every type whose representation differs between the old
-- `mysql` driver and `mysql2` (JSON, DECIMAL, BIGINT, BIT, DATE, DATETIME, TIMESTAMP), so the same
-- SELECT can be compared across connector versions. Triggers can watch it through `id`,
-- `created_at` and `updated_at`.

CREATE DATABASE IF NOT EXISTS appmixer_test;
USE appmixer_test;

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    qty BIGINT,
    price DECIMAL(12, 4),
    flag BIT(1),
    meta JSON,
    d DATE,
    dt DATETIME,
    ts TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO items (name, qty, price, flag, meta, d, dt, ts)
SELECT * FROM (
    SELECT 'small' AS name, 1 AS qty, 0.5000 AS price, b'0' AS flag, CAST('{"a": 1}' AS JSON) AS meta,
           DATE '2026-01-02' AS d, TIMESTAMP '2026-01-02 03:04:05' AS dt, TIMESTAMP '2026-01-02 03:04:05' AS ts
    UNION ALL
    SELECT 'big', 9007199254740993, 12345.6789, b'1', CAST('{"nested": {"list": [1, 2, 3]}}' AS JSON),
           DATE '1999-12-31', TIMESTAMP '1999-12-31 23:59:59', TIMESTAMP '2000-01-01 00:00:00'
    UNION ALL
    SELECT 'nulls', NULL, NULL, NULL, NULL, NULL, NULL, NULL
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM items);

#!/usr/bin/env bash
# Local MySQL servers for testing the appmixer.mysql connector (Appmixer-ai/appmixer-components#2952).
#
# Two servers, installed with Homebrew, run side by side without touching any other MySQL on the machine:
#   84-tls    MySQL 8.4, port 3307, require_secure_transport=ON, user `appmixer` with caching_sha2_password
#             and REQUIRE SSL, own CA (certs/ca.pem). This is the customer's setup.
#   80-plain  MySQL 8.0, port 3308, no TLS requirement, user `appmixer` with mysql_native_password.
#             Regression server for accounts that set no SSL fields.
#
# Usage:  local-mysql.sh setup | start [name] | stop [name] | status | sql <name> [args…] | tunnel | tunnel-status | print-auth [name]
# Files:  $MYSQL_TEST_DIR (default ~/mysql-test): certs/, <name>/{my.cnf,data,mysqld.log,mysql.sock,mysql.pid}, password
# Needs:  brew install mysql@8.4 mysql@8.0 ; openssl ; ngrok (only for `tunnel`)

set -euo pipefail

ROOT="${MYSQL_TEST_DIR:-$HOME/mysql-test}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MYSQLD_84="${MYSQLD_84:-/opt/homebrew/opt/mysql@8.4/bin/mysqld}"
MYSQLD_80="${MYSQLD_80:-/opt/homebrew/opt/mysql@8.0/bin/mysqld}"
MYSQL_CLIENT="${MYSQL_CLIENT:-/opt/homebrew/opt/mysql@8.4/bin/mysql}"
PORT_84="${PORT_84:-3307}"
PORT_80="${PORT_80:-3308}"
DB_USER=appmixer
DB_NAME=appmixer_test
INSTANCES="84-tls 80-plain"

die() { echo "local-mysql: $*" >&2; exit 1; }

mysqld_for() {
    case "$1" in
        84-tls) echo "$MYSQLD_84" ;;
        80-plain) echo "$MYSQLD_80" ;;
        *) die "unknown instance '$1' (84-tls|80-plain)" ;;
    esac
}

port_for() {
    case "$1" in
        84-tls) echo "$PORT_84" ;;
        80-plain) echo "$PORT_80" ;;
    esac
}

password() {
    if [ ! -s "$ROOT/password" ]; then
        mkdir -p "$ROOT"
        (umask 077; openssl rand -base64 18 | tr '+/' 'Aa' > "$ROOT/password")
    fi
    cat "$ROOT/password"
}

write_certs() {
    local c="$ROOT/certs"
    [ -s "$c/server-cert.pem" ] && return 0
    mkdir -p "$c"
    echo "==> generating CA + server certificate in $c"
    # The server certificate carries SANs for localhost, 127.0.0.1 and every ngrok TCP region, so a
    # client that verifies the hostname (mysql2 with `ca` + rejectUnauthorized: true) accepts it both
    # locally and through `ngrok tcp`.
    openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=Appmixer MySQL Test CA" \
        -keyout "$c/ca-key.pem" -out "$c/ca.pem" 2>/dev/null
    openssl req -newkey rsa:2048 -nodes -subj "/CN=appmixer-mysql-test" \
        -keyout "$c/server-key.pem" -out "$c/server.csr" 2>/dev/null
    printf '%s\n' \
        'subjectAltName=DNS:localhost,IP:127.0.0.1,DNS:*.tcp.ngrok.io,DNS:*.tcp.eu.ngrok.io,DNS:*.tcp.us.ngrok.io,DNS:*.tcp.ap.ngrok.io,DNS:*.tcp.au.ngrok.io,DNS:*.tcp.in.ngrok.io,DNS:*.tcp.jp.ngrok.io,DNS:*.tcp.sa.ngrok.io' \
        'basicConstraints=CA:FALSE' \
        'keyUsage=digitalSignature,keyEncipherment' \
        'extendedKeyUsage=serverAuth' \
        > "$c/server.ext"
    openssl x509 -req -days 3650 -in "$c/server.csr" -CA "$c/ca.pem" -CAkey "$c/ca-key.pem" -CAcreateserial \
        -extfile "$c/server.ext" -out "$c/server-cert.pem" 2>/dev/null
    # A second, unrelated CA for the "wrong CA" test case. It signed nothing the servers use.
    openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=Wrong CA (never trust)" \
        -keyout "$c/wrong-ca-key.pem" -out "$c/wrong-ca.pem" 2>/dev/null
    rm -f "$c/server.csr" "$c/server.ext"
}

write_cnf() {
    local name="$1" dir="$ROOT/$1"
    mkdir -p "$dir"
    {
        echo "[mysqld]"
        echo "port=$(port_for "$name")"
        echo "bind-address=127.0.0.1"
        echo "datadir=$dir/data"
        echo "socket=$dir/mysql.sock"
        echo "pid-file=$dir/mysql.pid"
        echo "log-error=$dir/mysqld.log"
        echo "mysqlx=OFF"
        case "$name" in
            84-tls)
                echo "require_secure_transport=ON"
                echo "ssl-ca=$ROOT/certs/ca.pem"
                echo "ssl-cert=$ROOT/certs/server-cert.pem"
                echo "ssl-key=$ROOT/certs/server-key.pem"
                ;;
            80-plain)
                echo "default_authentication_plugin=mysql_native_password"
                ;;
        esac
        echo "[client]"
        echo "socket=$dir/mysql.sock"
    } > "$dir/my.cnf"
}

is_running() {
    local pidfile="$ROOT/$1/mysql.pid"
    [ -s "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null
}

sql() {
    # sql <name> [mysql args…] — root over the unix socket (no password, local only).
    local name="$1"; shift
    "$MYSQL_CLIENT" --defaults-file="$ROOT/$name/my.cnf" -u root "$@"
}

start_one() {
    local name="$1" mysqld
    mysqld="$(mysqld_for "$name")"
    [ -x "$mysqld" ] || die "$mysqld not found. brew install mysql@${name:0:1}.${name:1:1}"
    [ -f "$ROOT/$name/my.cnf" ] || die "$name is not set up. Run: $0 setup"
    if is_running "$name"; then
        echo "$name already running (port $(port_for "$name"))"
        return 0
    fi
    echo "==> starting $name on 127.0.0.1:$(port_for "$name")"
    nohup "$mysqld" --defaults-file="$ROOT/$name/my.cnf" > /dev/null 2>&1 &
    disown || true
    local i
    for i in $(seq 1 60); do
        if sql "$name" -e 'SELECT 1' > /dev/null 2>&1; then
            return 0
        fi
        sleep 0.5
    done
    die "$name did not come up. See $ROOT/$name/mysqld.log"
}

stop_one() {
    local name="$1"
    if ! is_running "$name"; then
        echo "$name not running"
        return 0
    fi
    echo "==> stopping $name"
    kill "$(cat "$ROOT/$name/mysql.pid")"
    local i
    for i in $(seq 1 60); do
        is_running "$name" || return 0
        sleep 0.5
    done
    die "$name did not stop"
}

provision() {
    local name="$1" pw
    pw="$(password)"
    echo "==> provisioning $name: database $DB_NAME, user $DB_USER"
    case "$name" in
        84-tls)
            sql "$name" -e "CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED WITH caching_sha2_password BY '$pw' REQUIRE SSL;
                            ALTER USER '$DB_USER'@'%' IDENTIFIED WITH caching_sha2_password BY '$pw' REQUIRE SSL;"
            ;;
        80-plain)
            sql "$name" -e "CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$pw';
                            ALTER USER '$DB_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$pw';"
            ;;
    esac
    sql "$name" < "$HERE/schema.sql"
    sql "$name" -e "GRANT ALL ON $DB_NAME.* TO '$DB_USER'@'%'; FLUSH PRIVILEGES;"
}

setup() {
    write_certs
    local name
    for name in $INSTANCES; do
        write_cnf "$name"
        if [ ! -d "$ROOT/$name/data/mysql" ]; then
            echo "==> initializing data directory for $name"
            "$(mysqld_for "$name")" --defaults-file="$ROOT/$name/my.cnf" --initialize-insecure
        fi
        start_one "$name"
        provision "$name"
    done
    status
    echo
    echo "Password for user '$DB_USER' (both servers): $ROOT/password"
    echo "CA of the 84-tls server:                     $ROOT/certs/ca.pem"
    echo "Unrelated CA for the 'wrong CA' test:        $ROOT/certs/wrong-ca.pem"
}

status() {
    local name
    for name in $INSTANCES; do
        if is_running "$name"; then
            printf '%-9s running  127.0.0.1:%s  %s\n' "$name" "$(port_for "$name")" \
                "$(sql "$name" -N -e 'SELECT CONCAT(VERSION(), "  require_secure_transport=", @@require_secure_transport)' 2>/dev/null || echo '?')"
        else
            printf '%-9s stopped  (port %s)\n' "$name" "$(port_for "$name")"
        fi
    done
}

print_auth() {
    # JSON in the shape of the connector's account fields (auth.js). Host/port are the local ones;
    # replace them with the ngrok address when the account lives on a remote Appmixer instance.
    local name="$1" pw ssl
    pw="$(password)"
    ssl='"useSsl": "true"'
    [ "$name" = "80-plain" ] && ssl='"useSsl": "false"'
    printf '{ "dbUser": "%s", "dbHost": "127.0.0.1", "dbPort": "%s", "database": "%s", "dbPassword": "%s", %s }\n' \
        "$DB_USER" "$(port_for "$name")" "$DB_NAME" "$pw" "$ssl"
}

tunnel() {
    # Both servers through ONE ngrok agent session (the free plan allows a single session, but several
    # endpoints in it). MySQL needs `tcp` endpoints: an `http` endpoint (ngrok http 3307,
    # xxx.ngrok-free.app) answers ERR_NGROK_3004 and the client sees PROTOCOL_CONNECTION_LOST.
    command -v ngrok > /dev/null || die "ngrok not installed (brew install ngrok)"
    mkdir -p "$ROOT"
    cat > "$ROOT/ngrok.yml" <<EOF
version: "3"
endpoints:
  - name: mysql-84-tls
    url: tcp://
    upstream:
      url: $PORT_84
  - name: mysql-80-plain
    url: tcp://
    upstream:
      url: $PORT_80
EOF
    echo "==> exposing 84-tls (:$PORT_84) and 80-plain (:$PORT_80) through ngrok tcp endpoints."
    echo "    Host and port change on every start (free plan). Current addresses: $0 tunnel-status"
    exec ngrok start --all --config "${NGROK_CONFIG:-$HOME/.config/ngrok/ngrok.yml}" --config "$ROOT/ngrok.yml"
}

tunnel_status() {
    # Reads the running agent's local API and prints host:port per server.
    curl -sf localhost:4040/api/tunnels 2>/dev/null \
        | jq -r '.tunnels[] | select(.proto=="tcp") | "\(.name)  \(.public_url | sub("^tcp://"; ""))  ->  \(.config.addr)"' \
        || echo "no ngrok agent running on this machine (start one with: $0 tunnel)"
}

cmd="${1:-status}"
shift || true
case "$cmd" in
    setup)      setup ;;
    start)      for n in ${1:-$INSTANCES}; do start_one "$n"; done ;;
    stop)       for n in ${1:-$INSTANCES}; do stop_one "$n"; done ;;
    status)     status ;;
    sql)        sql "$@" ;;
    tunnel)     tunnel ;;
    tunnel-status) tunnel_status ;;
    print-auth) print_auth "${1:-84-tls}" ;;
    *)          die "usage: $0 setup | start [name] | stop [name] | status | sql <name> [args] | tunnel | tunnel-status | print-auth [name]" ;;
esac

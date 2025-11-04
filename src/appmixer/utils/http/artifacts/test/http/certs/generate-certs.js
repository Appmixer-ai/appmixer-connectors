'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Version number to track certificate format changes
// Increment this when changing certificate generation (e.g., adding SANs)
const CERT_VERSION = 2;

/**
 * Generate self-signed certificates for testing SSL/TLS
 * Certificates are generated in the temp directory specified by the caller
 */
async function generateCertificates() {
    // Get the temp certs directory from environment or use default
    const certsDir = process.env.APPMIXER_TEST_CERTS_DIR ||
        path.join(os.tmpdir(), `appmixer-test-certs-${process.pid}`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
    }

    try {
        // Check if certificates already exist
        const keyFile = path.join(certsDir, 'server-key.pem');
        const certFile = path.join(certsDir, 'server-cert.pem');
        const caKeyFile = path.join(certsDir, 'ca-key.pem');
        const caCertFile = path.join(certsDir, 'ca-cert.pem');
        const clientKeyFile = path.join(certsDir, 'client-key.pem');
        const clientCertFile = path.join(certsDir, 'client-cert.pem');
        const versionFile = path.join(certsDir, '.cert-version');

        // Check if all certificates exist and version is current
        const allCertsExist = fs.existsSync(keyFile) && fs.existsSync(certFile) &&
            fs.existsSync(caCertFile) && fs.existsSync(caKeyFile) &&
            fs.existsSync(clientKeyFile) && fs.existsSync(clientCertFile);

        const versionCurrent = fs.existsSync(versionFile) &&
            fs.readFileSync(versionFile, 'utf8').trim() === String(CERT_VERSION);

        if (allCertsExist && versionCurrent) {
            console.log(`✓ Certificates already exist in ${certsDir}`);
            return;
        }

        // If version mismatch or some files missing, regenerate
        if (allCertsExist && !versionCurrent) {
            console.log('⚠ Certificate version mismatch. Regenerating...');
            // Clean up old certificates
            [keyFile, certFile, caKeyFile, caCertFile, clientKeyFile, clientCertFile]
                .forEach(f => {
                    if (fs.existsSync(f)) fs.unlinkSync(f);
                });
        }

        console.log(`Generating SSL certificates in ${certsDir}...`);

        // Generate CA private key
        execSync(
            `openssl genrsa -out ${caKeyFile} 2048`,
            { stdio: 'pipe' }
        );

        // Generate CA certificate
        execSync(
            `openssl req -new -x509 -key ${caKeyFile} -out ${caCertFile} ` +
            '-days 3650 -subj "/C=US/ST=State/L=City/O=Org/CN=localhost"',
            { stdio: 'pipe' }
        );

        // Generate server private key
        execSync(
            `openssl genrsa -out ${keyFile} 2048`,
            { stdio: 'pipe' }
        );

        // Generate server certificate signing request with SANs
        const csrFile = path.join(certsDir, 'server.csr');
        const sanConfig = path.join(certsDir, 'san.conf');

        // Create SAN configuration file with proper section
        fs.writeFileSync(sanConfig,
            '[v3_req]\nsubjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:0.0.0.0\n'
        );

        execSync(
            `openssl req -new -key ${keyFile} -out ${csrFile} ` +
            '-subj "/C=US/ST=State/L=City/O=Org/CN=localhost"',
            { stdio: 'pipe' }
        );

        // Sign server certificate with CA and SANs
        execSync(
            `openssl x509 -req -in ${csrFile} -CA ${caCertFile} -CAkey ${caKeyFile} ` +
            `-CAcreateserial -out ${certFile} -days 365 -sha256 ` +
            `-extfile ${sanConfig} -extensions v3_req`,
            { stdio: 'pipe' }
        );

        // Clean up SAN config
        fs.unlinkSync(sanConfig);

        // Clean up CSR
        fs.unlinkSync(csrFile);

        // Generate client private key
        execSync(
            `openssl genrsa -out ${clientKeyFile} 2048`,
            { stdio: 'pipe' }
        );

        // Generate client certificate signing request
        const clientCsrFile = path.join(certsDir, 'client.csr');
        execSync(
            `openssl req -new -key ${clientKeyFile} -out ${clientCsrFile} ` +
            '-subj "/C=US/ST=State/L=City/O=Org/CN=localhost"',
            { stdio: 'pipe' }
        );

        // Sign client certificate with CA
        execSync(
            `openssl x509 -req -in ${clientCsrFile} -CA ${caCertFile} ` +
            `-CAkey ${caKeyFile} -CAcreateserial -out ${clientCertFile} ` +
            '-days 365 -sha256',
            { stdio: 'pipe' }
        );

        // Clean up CSR
        fs.unlinkSync(clientCsrFile);

        // Write version file to track certificate format
        fs.writeFileSync(versionFile, String(CERT_VERSION));

        console.log('✓ All certificates generated successfully');
    } catch (error) {
        console.error(`✗ Certificate generation failed: ${error.message}`);
        throw error;
    }
}

// If this script is run directly, generate certificates
if (require.main === module) {
    generateCertificates()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = generateCertificates;

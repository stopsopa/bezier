#!/bin/bash

# refreshhttps.sh
# Generates a self-signed certificate for localhost

KEY_FILE="key.pem"
CERT_FILE="cert.pem"

echo "Generating self-signed certificate..."


# Create a temporary config file for SANs
cat > san.cnf <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = US
ST = Local
L = Local
O = Dev
CN = 0.0.0.0

[v3_req]
subjectAltName = @alt_names

[alt_names]
IP.1 = 0.0.0.0
IP.2 = 127.0.0.1
DNS.1 = localhost
EOF

echo "Generating self-signed certificate with SANs (0.0.0.0, localhost)..."

openssl req -x509 -newkey rsa:4096 -keyout "$KEY_FILE" -out "$CERT_FILE" -days 3650 -nodes -config san.cnf -extensions v3_req
SSL_EXIT=$?

rm san.cnf

if [ $SSL_EXIT -eq 0 ]; then
    echo "✅ Successfully generated $KEY_FILE and $CERT_FILE"
    echo "Certificate covers: 0.0.0.0, 127.0.0.1, localhost"
    echo "You can now run the server with HTTPS support."
else
    echo "❌ Failed to generate certificates."
    exit 1
fi

#!/bin/bash

# Run tests with code coverage using c8 and Node.js built-in test runner
# Coverage report is generated in ./coverage directory

set -e

cd "$(dirname "$0")"

echo "Running tests with coverage..."
echo ""

node node_modules/.bin/c8 \
  --reporter=html \
  --reporter=text \
  --reporter=lcov \
  node --test common.test.js

echo ""
echo "✓ Coverage report generated in ./coverage/index.html"

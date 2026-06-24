#!/bin/bash
set -e

BASE_URL="http://localhost:5000/api"
COOKIE_FILE=$(mktemp)

echo "=== Login ==="
curl -s -c "$COOKIE_FILE" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq .

echo "=== Verify session ==="
curl -s -b "$COOKIE_FILE" "$BASE_URL/auth/me" | jq .

echo "=== Dashboard ==="
curl -s -b "$COOKIE_FILE" "$BASE_URL/dashboard" | jq .

echo "=== Users ==="
curl -s -b "$COOKIE_FILE" "$BASE_URL/users" | jq .

echo "=== Logout ==="
curl -s -b "$COOKIE_FILE" -X POST "$BASE_URL/auth/logout" | jq .

echo "=== Access without token ==="
curl -s "$BASE_URL/auth/me" | jq .

rm "$COOKIE_FILE"
echo "✅ Smoke tests completed."

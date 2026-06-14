#!/bin/sh
set -e

echo "[entrypoint] Gerando env-config.js..."
echo "[entrypoint] URL_API=${URL_API}"

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__env = {
  URL_API: "${URL_API:-http://localhost:3007}",
  VITE_SOCKET_URL: "${VITE_SOCKET_URL:-http://localhost:4000}",
  METABASE_URL: "${METABASE_URL:-http://localhost:3005}",
};
EOF

echo "[entrypoint] env-config.js gerado:"
cat /usr/share/nginx/html/env-config.js

exec "$@"

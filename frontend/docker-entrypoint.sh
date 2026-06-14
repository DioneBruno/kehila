#!/bin/sh
set -e

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__env = {
  URL_API: "${URL_API:-http://localhost:3007}",
  VITE_SOCKET_URL: "${VITE_SOCKET_URL:-http://localhost:4000}",
  METABASE_URL: "${METABASE_URL:-http://localhost:3005}",
};
EOF

exec "$@"

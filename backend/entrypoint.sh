#!/bin/sh
# =============================================================
#  FILE LOCATION: Inventry-Management-System/docker/backend/entrypoint.sh
#  Runs automatically when backend container starts
# =============================================================

set -e

echo "⏳ Waiting for PostgreSQL..."
until php -r "
  \$conn = @pg_connect('host=postgres dbname=inventory_db user=postgres password=secret');
  exit(\$conn ? 0 : 1);
"; do
  sleep 2
  echo "  ...still waiting"
done
echo "✅ PostgreSQL is ready!"

# ── Generate APP_KEY if missing ───────────────────────────────
if [ -z "$(grep '^APP_KEY=base64' /var/www/.env 2>/dev/null)" ]; then
  echo "🔑 Generating APP_KEY..."
  php artisan key:generate --force
fi

# ── Run migrations (safe — skips if already done) ────────────
echo "📦 Running migrations..."
php artisan migrate --force --no-interaction

# ── Seed default admin user ───────────────────────────────────
echo "🌱 Seeding admin user..."
php artisan db:seed --force --no-interaction 2>/dev/null || true

# ── Clear and cache config ────────────────────────────────────
echo "🚀 Optimizing..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan storage:link 2>/dev/null || true

echo ""
echo "✅ Ceyntics IMS Backend Ready!"
echo "   API → http://localhost:8000/api"
echo ""

exec "$@"

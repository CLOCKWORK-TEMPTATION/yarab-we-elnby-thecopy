#!/bin/sh
set -e

echo "🔄 Running database migrations..."
if ! pnpm run db:push; then
  echo "❌ Database migration failed!"
  exit 1
fi

echo "✅ Migrations complete!"
echo "🚀 Starting server..."
exec "$@"

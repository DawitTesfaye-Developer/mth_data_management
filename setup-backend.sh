#!/usr/bin/env bash
# Builds a complete Laravel app in ./backend from a fresh skeleton + the files in ./backend-src.
# Requirements: PHP 8.2+, Composer, a reachable PostgreSQL (see docker-compose.yml).
set -euo pipefail
cd "$(dirname "$0")"

if [ -f backend/artisan ]; then
  echo "backend/ is already a Laravel app. Delete it first to re-run the setup." >&2
  exit 1
fi

DB_HOST="${DB_HOST:-127.0.0.1}"; DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-peopledesk}"; DB_USERNAME="${DB_USERNAME:-peopledesk}"; DB_PASSWORD="${DB_PASSWORD:-secret}"

echo "==> Creating Laravel skeleton"
composer create-project laravel/laravel .skeleton --prefer-dist --no-interaction --no-scripts
cd .skeleton
cp .env.example .env
php artisan key:generate --ansi

echo "==> Pointing .env at PostgreSQL"
sed -i -E '/^#? *DB_/d' .env
cat >> .env <<ENV

DB_CONNECTION=pgsql
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_DATABASE=$DB_DATABASE
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
ENV
sed -i -E 's/^APP_TIMEZONE=.*//' .env
echo "APP_TIMEZONE=Africa/Addis_Ababa" >> .env

echo "==> Installing API scaffolding (Sanctum)"
php artisan install:api --no-interaction

echo "==> Applying PeopleDesk code"
cp -R ../backend-src/. .

echo "==> Migrating and seeding"
php artisan migrate --seed --force

cd ..
rm -rf backend
mv .skeleton backend
echo
echo "Done. Start the API with:  cd backend && php artisan serve"

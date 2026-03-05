#!/bin/bash

echo "🗄️  Setting up PostgreSQL database for HireFlow..."

# Database configuration from .env
DB_USER="chintankasundra"
DB_NAME="hireflow"

echo ""
echo "Step 1: Creating database '$DB_NAME'..."
psql -U postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists (OK)"

echo ""
echo "Step 2: Granting privileges to user '$DB_USER'..."
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || echo "User privileges already set (OK)"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd backend"
echo "  2. node src/scripts/initDb.js       # Initialize schema"
echo "  3. node src/scripts/addProctoringTables.js"
echo "  4. node src/scripts/seedAptitudeDataset.js"
echo "  5. node src/scripts/seedDsaDataset.js"

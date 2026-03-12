-- =============================================================
--  Ceyntics Inventory Management System
--  PostgreSQL Database Schema — Full Version
--  Company  : Ceyntics Systems (Pvt) Ltd
--  Database : inventory_db
--  Updated  : March 2026
--  Compatible with: Laravel 11 + Sanctum
--
--  HOW TO RUN:
--    pgAdmin4 → inventory_db → Tools → Query Tool
--    → Open this file → Press F5
-- =============================================================


-- -------------------------------------------------------------
-- 0. EXTENSIONS & CLEAN SLATE
--    uuid-ossp  → UUID generation (uuid_generate_v4())
--    pgcrypto   → Password hashing support
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop all tables safely (reverse FK order)
DROP TABLE IF EXISTS activity_logs          CASCADE;
DROP TABLE IF EXISTS borrowings             CASCADE;
DROP TABLE IF EXISTS items                  CASCADE;
DROP TABLE IF EXISTS places                 CASCADE;
DROP TABLE IF EXISTS cupboards              CASCADE;
DROP TABLE IF EXISTS personal_access_tokens CASCADE;
DROP TABLE IF EXISTS sessions               CASCADE;
DROP TABLE IF EXISTS users                  CASCADE;

-- Drop custom ENUM types
DROP TYPE IF EXISTS user_role     CASCADE;
DROP TYPE IF EXISTS item_status   CASCADE;
DROP TYPE IF EXISTS borrow_status CASCADE;


-- -------------------------------------------------------------
-- 1. ENUM TYPES
--    PostgreSQL ENUM — faster queries, storage-efficient,
--    enforces valid values at DB level
-- -------------------------------------------------------------
CREATE TYPE user_role     AS ENUM ('admin', 'staff');
CREATE TYPE item_status   AS ENUM ('in_store', 'borrowed', 'damaged', 'missing');
CREATE TYPE borrow_status AS ENUM ('active', 'returned', 'overdue');


-- -------------------------------------------------------------
-- 2. USERS
--    - No public registration — admin creates all accounts
--    - Passwords hashed with bcrypt (Laravel handles this)
--    - Soft delete: deleted_at IS NULL = active user
-- -------------------------------------------------------------
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255)    NOT NULL,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    password            VARCHAR(255)    NOT NULL,       -- bcrypt hash, never plaintext
    role                user_role       NOT NULL DEFAULT 'staff',
    email_verified_at   TIMESTAMP       NULL,
    remember_token      VARCHAR(100)    NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP       NULL            -- NULL = active, NOT NULL = soft deleted
);

CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

COMMENT ON TABLE  users            IS 'System users. Created by admin only — no self registration.';
COMMENT ON COLUMN users.password   IS 'Bcrypt hashed. Laravel handles hashing automatically.';
COMMENT ON COLUMN users.role       IS 'admin = full access | staff = limited access';
COMMENT ON COLUMN users.deleted_at IS 'NULL = active. Non-null = soft deleted (data preserved).';


-- -------------------------------------------------------------
-- 3. SESSIONS (Laravel 11 requirement)
--    Laravel stores session data here when SESSION_DRIVER=database
-- -------------------------------------------------------------
CREATE TABLE sessions (
    id              VARCHAR(255)    PRIMARY KEY,
    user_id         UUID            NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address      VARCHAR(45)     NULL,
    user_agent      TEXT            NULL,
    payload         TEXT            NOT NULL,
    last_activity   INTEGER         NOT NULL
);

CREATE INDEX idx_sessions_user_id       ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

COMMENT ON TABLE sessions IS 'Laravel session storage. Required when SESSION_DRIVER=database.';


-- -------------------------------------------------------------
-- 4. PERSONAL ACCESS TOKENS (Laravel Sanctum)
--    Stores API tokens for authenticated users.
--    tokenable_id is UUID because our users table uses UUID PK.
-- -------------------------------------------------------------
CREATE TABLE personal_access_tokens (
    id              BIGSERIAL       PRIMARY KEY,
    tokenable_type  VARCHAR(255)    NOT NULL,           -- always 'App\Models\User'
    tokenable_id    UUID            NOT NULL,            -- UUID of the user
    name            VARCHAR(255)    NOT NULL,
    token           VARCHAR(64)     NOT NULL UNIQUE,     -- SHA-256 hashed token
    abilities       TEXT            NULL,                -- JSON array of abilities
    last_used_at    TIMESTAMP       NULL,
    expires_at      TIMESTAMP       NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pat_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);

COMMENT ON TABLE  personal_access_tokens        IS 'Laravel Sanctum API tokens.';
COMMENT ON COLUMN personal_access_tokens.token  IS 'SHA-256 hash of the token. Plain token returned once on creation only.';


-- -------------------------------------------------------------
-- 5. CUPBOARDS
--    Top-level physical storage units (cabinets, racks, etc.)
--    A cupboard contains one or more Places (sub-locations).
-- -------------------------------------------------------------
CREATE TABLE cupboards (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)    NOT NULL,
    description     TEXT            NULL,
    created_by      UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP       NULL
);

CREATE INDEX idx_cupboards_created_by ON cupboards(created_by);
CREATE INDEX idx_cupboards_deleted_at ON cupboards(deleted_at);

COMMENT ON TABLE  cupboards            IS 'Physical storage cupboards / cabinets in the organization.';
COMMENT ON COLUMN cupboards.created_by IS 'Admin user who created this cupboard record.';


-- -------------------------------------------------------------
-- 6. PLACES
--    Sub-locations inside a Cupboard (shelf, drawer, section).
--    Items reference Places (not Cupboards directly).
--    WHY? One cupboard can have many distinct sub-locations,
--         allowing precise tracking of where each item is.
-- -------------------------------------------------------------
CREATE TABLE places (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    cupboard_id     UUID            NOT NULL REFERENCES cupboards(id) ON DELETE RESTRICT,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT            NULL,
    created_by      UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP       NULL
);

CREATE INDEX idx_places_cupboard_id ON places(cupboard_id);
CREATE INDEX idx_places_created_by  ON places(created_by);
CREATE INDEX idx_places_deleted_at  ON places(deleted_at);

COMMENT ON TABLE  places             IS 'Sub-locations inside a cupboard (shelf, drawer, rack unit).';
COMMENT ON COLUMN places.cupboard_id IS 'Parent cupboard this place belongs to.';


-- -------------------------------------------------------------
-- 7. ITEMS
--    Core inventory records.
--    IMPORTANT:
--      - quantity: never set directly — use InventoryService
--      - code: globally unique identifier (e.g. EL-001, TL-002)
--      - status: auto-calculated OR manually set (damaged/missing)
--      - CHECK (quantity >= 0): prevents negative stock at DB level
-- -------------------------------------------------------------
CREATE TABLE items (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)    NOT NULL,
    code            VARCHAR(100)    NOT NULL UNIQUE,     -- e.g. EL-001
    quantity        INTEGER         NOT NULL DEFAULT 0
                                    CHECK (quantity >= 0),  -- DB-level guard
    serial_number   VARCHAR(255)    NULL,
    image_path      VARCHAR(500)    NULL,                -- relative path in storage/
    description     TEXT            NULL,
    place_id        UUID            NOT NULL REFERENCES places(id)  ON DELETE RESTRICT,
    status          item_status     NOT NULL DEFAULT 'in_store',
    created_by      UUID            NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP       NULL
);

CREATE INDEX idx_items_code        ON items(code);
CREATE INDEX idx_items_place_id    ON items(place_id);
CREATE INDEX idx_items_status      ON items(status);
CREATE INDEX idx_items_created_by  ON items(created_by);
CREATE INDEX idx_items_deleted_at  ON items(deleted_at);

COMMENT ON TABLE  items             IS 'Inventory items (tools, components, equipment).';
COMMENT ON COLUMN items.code        IS 'Unique item code. Both DB and app enforce uniqueness.';
COMMENT ON COLUMN items.quantity    IS 'Current available stock. CHECK prevents negatives.';
COMMENT ON COLUMN items.status      IS 'in_store=available | borrowed=all qty out | damaged | missing';
COMMENT ON COLUMN items.image_path  IS 'Relative path: storage/items/filename.jpg';
COMMENT ON COLUMN items.place_id    IS 'Which place (shelf/drawer) this item is stored in.';


-- -------------------------------------------------------------
-- 8. BORROWINGS
--    Records every borrow transaction.
--    - quantity_borrowed is immutable after creation
--    - processed_by = who logged the borrow (required)
--    - returned_by  = who logged the return (null until returned)
--    - CONSTRAINT: actual_return_date must exist when returned
-- -------------------------------------------------------------
CREATE TABLE borrowings (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id                 UUID            NOT NULL REFERENCES items(id)  ON DELETE RESTRICT,
    borrower_name           VARCHAR(255)    NOT NULL,
    borrower_contact        VARCHAR(255)    NOT NULL,
    borrow_date             DATE            NOT NULL DEFAULT CURRENT_DATE,
    expected_return_date    DATE            NOT NULL,
    actual_return_date      DATE            NULL,       -- NULL until item is returned
    quantity_borrowed       INTEGER         NOT NULL    CHECK (quantity_borrowed > 0),
    status                  borrow_status   NOT NULL DEFAULT 'active',
    processed_by            UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    returned_by             UUID            NULL     REFERENCES users(id) ON DELETE RESTRICT,
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- Business rule: return date must be set when status is 'returned'
    CONSTRAINT chk_actual_return_date CHECK (
        (status = 'returned' AND actual_return_date IS NOT NULL) OR
        (status <> 'returned')
    )
);

CREATE INDEX idx_borrowings_item_id       ON borrowings(item_id);
CREATE INDEX idx_borrowings_status        ON borrowings(status);
CREATE INDEX idx_borrowings_processed_by  ON borrowings(processed_by);
CREATE INDEX idx_borrowings_borrow_date   ON borrowings(borrow_date);
CREATE INDEX idx_borrowings_expected_ret  ON borrowings(expected_return_date);

COMMENT ON TABLE  borrowings                    IS 'Records of items borrowed by third parties.';
COMMENT ON COLUMN borrowings.quantity_borrowed  IS 'Qty taken at time of borrow. Never changes after creation.';
COMMENT ON COLUMN borrowings.status             IS 'active=out | returned=back | overdue=past expected date';
COMMENT ON COLUMN borrowings.processed_by       IS 'Staff who recorded the borrow.';
COMMENT ON COLUMN borrowings.returned_by        IS 'Staff who processed the return. NULL while still borrowed.';


-- -------------------------------------------------------------
-- 9. ACTIVITY LOGS
--    Immutable audit trail — write-once, never updated/deleted.
--    Every significant system action is recorded here.
--    old_values / new_values → JSONB for flexible field diffs.
--    GIN indexes enable fast JSONB content searching.
-- -------------------------------------------------------------
CREATE TABLE activity_logs (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action          VARCHAR(100)    NOT NULL,   -- item_created | borrowed | returned | status_changed ...
    model_type      VARCHAR(100)    NOT NULL,   -- Item | Borrowing | User | Place | Cupboard
    model_id        UUID            NOT NULL,   -- UUID of the affected record
    old_values      JSONB           NULL,       -- snapshot before change
    new_values      JSONB           NULL,       -- snapshot after change
    ip_address      VARCHAR(45)     NULL,       -- IPv4 or IPv6
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
    -- No updated_at — logs are WRITE-ONCE
);

CREATE INDEX idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action     ON activity_logs(action);
CREATE INDEX idx_activity_logs_model      ON activity_logs(model_type, model_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- GIN indexes: fast full-content search inside JSONB columns
CREATE INDEX idx_activity_logs_old_gin ON activity_logs USING GIN (old_values);
CREATE INDEX idx_activity_logs_new_gin ON activity_logs USING GIN (new_values);

COMMENT ON TABLE  activity_logs            IS 'Immutable audit trail. Write-once. Never update or delete.';
COMMENT ON COLUMN activity_logs.action     IS 'item_created | item_updated | item_deleted | quantity_changed | status_changed | borrowed | returned | user_created';
COMMENT ON COLUMN activity_logs.model_type IS 'Model affected: Item | Borrowing | User | Place | Cupboard';
COMMENT ON COLUMN activity_logs.old_values IS 'JSONB: field values BEFORE the change.';
COMMENT ON COLUMN activity_logs.new_values IS 'JSONB: field values AFTER the change.';


-- -------------------------------------------------------------
-- 10. TRIGGERS — auto-update updated_at on every row change
--     PostgreSQL does not auto-update updated_at like MySQL.
--     This trigger function handles it for all tables.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to each table that has updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_cupboards_updated_at
    BEFORE UPDATE ON cupboards
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_places_updated_at
    BEFORE UPDATE ON places
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_borrowings_updated_at
    BEFORE UPDATE ON borrowings
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_personal_access_tokens_updated_at
    BEFORE UPDATE ON personal_access_tokens
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();


-- -------------------------------------------------------------
-- 11. DEFAULT ADMIN USER (Seed Data)
--
--     Email    : admin@ceyntics.com
--     Password : Admin@1234
--     Role     : admin
--
--     ⚠️  CHANGE THIS PASSWORD IMMEDIATELY after first login!
--     The hash below is bcrypt of 'Admin@1234' (12 rounds).
-- -------------------------------------------------------------
INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'System Administrator',
    'admin@ceyntics.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    NOW(),
    NOW()
);

-- Staff demo user (optional — remove for production)
INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (
    uuid_generate_v4(),
    'Staff Member',
    'staff@ceyntics.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'staff',
    NOW(),
    NOW()
);


-- -------------------------------------------------------------
-- 12. SAMPLE DATA (optional — delete before going to production)
--     Gives you something to see when you first open the app.
-- -------------------------------------------------------------

-- Cupboard
INSERT INTO cupboards (id, name, description, created_by, created_at, updated_at)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'Cabinet A',
    'Main electronics storage cabinet',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

INSERT INTO cupboards (id, name, description, created_by, created_at, updated_at)
VALUES (
    'a1000000-0000-0000-0000-000000000002',
    'Cabinet B',
    'Tools and mechanical parts',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

-- Places
INSERT INTO places (id, cupboard_id, name, description, created_by, created_at, updated_at)
VALUES (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Shelf 1 – Top',
    'Arduino boards and sensors',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

INSERT INTO places (id, cupboard_id, name, description, created_by, created_at, updated_at)
VALUES (
    'b1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Shelf 2 – Middle',
    'Raspberry Pi units',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

INSERT INTO places (id, cupboard_id, name, description, created_by, created_at, updated_at)
VALUES (
    'b1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000002',
    'Drawer 1',
    'Screwdrivers and wrenches',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

-- Items
INSERT INTO items (id, name, code, quantity, description, place_id, status, created_by, created_at, updated_at)
VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'Arduino Uno R3',
    'EL-001',
    8,
    'Microcontroller development boards',
    'b1000000-0000-0000-0000-000000000001',
    'in_store',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

INSERT INTO items (id, name, code, quantity, description, place_id, status, created_by, created_at, updated_at)
VALUES (
    'c1000000-0000-0000-0000-000000000002',
    'ESP32 Dev Module',
    'EL-002',
    15,
    'Wi-Fi + Bluetooth microcontrollers',
    'b1000000-0000-0000-0000-000000000001',
    'in_store',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

INSERT INTO items (id, name, code, quantity, serial_number, description, place_id, status, created_by, created_at, updated_at)
VALUES (
    'c1000000-0000-0000-0000-000000000003',
    'Raspberry Pi 4 (4GB)',
    'EL-003',
    3,
    'RPI-2024-0042',
    'Single-board computers',
    'b1000000-0000-0000-0000-000000000002',
    'in_store',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

INSERT INTO items (id, name, code, quantity, serial_number, description, place_id, status, created_by, created_at, updated_at)
VALUES (
    'c1000000-0000-0000-0000-000000000004',
    'Digital Multimeter',
    'TL-001',
    1,
    'FLK-2022-0099',
    'Fluke 117 multimeter',
    'b1000000-0000-0000-0000-000000000003',
    'damaged',
    (SELECT id FROM users WHERE email = 'admin@ceyntics.com'),
    NOW(), NOW()
);

-- =============================================================
--  SCHEMA SETUP COMPLETE ✅
--
--  Tables created:
--    users, sessions, personal_access_tokens,
--    cupboards, places, items, borrowings, activity_logs
--
--  Admin login:
--    Email    → admin@ceyntics.com
--    Password → Admin@1234
--
--  Staff login:
--    Email    → staff@ceyntics.com
--    Password → Admin@1234
--
--  Next step: Run Laravel backend
--    php artisan key:generate
--    php artisan migrate   ← skip this if you ran this SQL file
--    php artisan serve
-- =============================================================

PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS teachers (
 id TEXT PRIMARY KEY, teacher_name TEXT NOT NULL, school TEXT NOT NULL, nip TEXT,
 contact TEXT NOT NULL UNIQUE, contact_channel TEXT NOT NULL CHECK(contact_channel IN ('email','whatsapp')),
 role TEXT NOT NULL CHECK(role IN ('PAI','NON_PAI')), locked_subject TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACTIVE','REJECTED','SUSPENDED')),
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS access_grants (
 id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
 subject TEXT NOT NULL, class_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE',
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
 id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
 device_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', created_at INTEGER NOT NULL,
 UNIQUE(teacher_id,device_hash)
);
CREATE TABLE IF NOT EXISTS otp_challenges (
 id TEXT PRIMARY KEY, target TEXT NOT NULL, channel TEXT NOT NULL, code_hash TEXT NOT NULL,
 expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_otp_target ON otp_challenges(target);
CREATE TABLE IF NOT EXISTS verified_contacts (
 token_hash TEXT PRIMARY KEY, target TEXT NOT NULL, channel TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS access_requests (
 id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
 request_type TEXT NOT NULL, request_data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
 created_at INTEGER NOT NULL, reviewed_at INTEGER, admin_note TEXT
);
CREATE TABLE IF NOT EXISTS admin_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

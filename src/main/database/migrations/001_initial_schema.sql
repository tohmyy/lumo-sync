-- LumoSync MVP initial schema (DATABASE-DESIGN.md §46)

CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    app_version TEXT,
    is_current INTEGER NOT NULL DEFAULT 0,
    last_seen_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    language TEXT,
    content TEXT NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    created_by_device_id TEXT,
    updated_by_device_id TEXT,
    FOREIGN KEY (created_by_device_id) REFERENCES devices(id),
    FOREIGN KEY (updated_by_device_id) REFERENCES devices(id)
);

CREATE INDEX idx_assets_updated_at ON assets(updated_at);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_favorite ON assets(is_favorite);
CREATE INDEX idx_assets_deleted_at ON assets(deleted_at);
CREATE INDEX idx_assets_updated_by_device ON assets(updated_by_device_id);

CREATE TABLE asset_revisions (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    operation TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    language TEXT,
    content TEXT NOT NULL,
    is_favorite INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    device_id TEXT NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (device_id) REFERENCES devices(id),
    UNIQUE(asset_id, version)
);

CREATE TABLE collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    created_by_device_id TEXT,
    updated_by_device_id TEXT,
    FOREIGN KEY (created_by_device_id) REFERENCES devices(id),
    FOREIGN KEY (updated_by_device_id) REFERENCES devices(id)
);

CREATE TABLE collection_assets (
    collection_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (collection_id, asset_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_collection_assets_asset ON collection_assets(asset_id);
CREATE INDEX idx_collection_assets_collection ON collection_assets(collection_id);

CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
);

CREATE UNIQUE INDEX idx_tags_normalized_name_active
ON tags(normalized_name)
WHERE deleted_at IS NULL;

CREATE TABLE asset_tags (
    asset_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (asset_id, tag_id),
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE INDEX idx_asset_tags_tag ON asset_tags(tag_id);
CREATE INDEX idx_asset_tags_asset ON asset_tags(asset_id);

CREATE TABLE recent_assets (
    asset_id TEXT PRIMARY KEY,
    opened_at TEXT NOT NULL,
    open_count INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE VIRTUAL TABLE asset_search
USING fts5(
    asset_id UNINDEXED,
    title,
    description,
    content,
    language
);

CREATE TABLE sync_operations (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    base_version INTEGER,
    target_version INTEGER,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    last_error TEXT
);

CREATE INDEX idx_sync_operations_status ON sync_operations(status);
CREATE INDEX idx_sync_operations_entity ON sync_operations(entity_type, entity_id);
CREATE INDEX idx_sync_operations_created ON sync_operations(created_at);

CREATE TABLE sync_state (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE sync_conflicts (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    local_version INTEGER,
    remote_version INTEGER,
    local_payload TEXT NOT NULL,
    remote_payload TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    resolution TEXT,
    resolved_at TEXT,
    resolved_by_device_id TEXT,
    FOREIGN KEY (resolved_by_device_id) REFERENCES devices(id)
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

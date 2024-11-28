CREATE TABLE IF NOT EXISTS guild_users (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    _version BIGINT UNSIGNED NOT NULL DEFAULT 1,

    guild_profile_id BIGINT UNSIGNED NOT NULL,
    roblox_id BIGINT UNSIGNED NOT NULL,
    roblox_username VARCHAR(20) NOT NULL,

    points INT NOT NULL,

    note_content VARCHAR(500),
    note_visible BOOLEAN NOT NULL DEFAULT TRUE,
    note_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    ranklock_rank INT UNSIGNED NOT NULL DEFAULT 0,
    ranklock_shadow BOOLEAN NOT NULL DEFAULT FALSE,
    ranklock_reason VARCHAR(500),
    ranklock_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(_id)
);

-- Triggers

CREATE TRIGGER IF NOT EXISTS guild_users__before
BEFORE UPDATE ON guild_users
FOR EACH ROW
BEGIN
    SET NEW._version = OLD._version + 1;
END;
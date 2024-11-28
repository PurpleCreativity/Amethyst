CREATE TABLE IF NOT EXISTS roblox_places (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    _version BIGINT UNSIGNED NOT NULL DEFAULT 1,

    guild_profile_id BIGINT UNSIGNED NOT NULL,

    nickname VARCHAR(32) NOT NULL,
    id VARCHAR(20) NOT NULL,
    `key` VARCHAR(1000) NOT NULL,

    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(_id)
);
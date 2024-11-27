CREATE TABLE IF NOT EXISTS roblox_places (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    guild_profile_id BIGINT UNSIGNED NOT NULL,

    place_nickname VARCHAR(32) NOT NULL,
    place_id VARCHAR(20) NOT NULL,
    place_key VARCHAR(1000) NOT NULL,

    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id)
);
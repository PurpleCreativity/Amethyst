CREATE TABLE IF NOT EXISTS roblox_places (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    guild_id VARCHAR(20) NOT NULL,

    place_nickname VARCHAR(32) NOT NULL,
    place_id BIGINT UNSIGNED NOT NULL,
    place_key VARCHAR(1000) NOT NULL,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_RobloxPlaces_BeforeUpdate
BEFORE UPDATE ON roblox_places
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

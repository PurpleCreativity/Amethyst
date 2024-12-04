CREATE TABLE IF NOT EXISTS roblox_places (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,

    guild_id BIGINT UNSIGNED NOT NULL,

    nickname VARCHAR(32) NOT NULL,
    place_id VARCHAR(20) NOT NULL,
    `key` VARCHAR(1000) NOT NULL,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_RobloxPlaces_BeforeUpdate
BEFORE UPDATE ON roblox_places
FOR EACH ROW
BEGIN
    SET NEW.version = OLD.version + 1;
END;

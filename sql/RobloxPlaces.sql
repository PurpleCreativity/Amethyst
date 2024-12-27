-- This is here internally, currently unused.

CREATE TABLE IF NOT EXISTS RobloxPlaces (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    guildId VARCHAR(20) NOT NULL,

    placeNickname VARCHAR(32) NOT NULL,
    placeId BIGINT UNSIGNED NOT NULL,
    placeKey VARCHAR(1000) NOT NULL,

    FOREIGN KEY (guildId) REFERENCES GuildProfiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_RobloxPlaces_BeforeUpdate
BEFORE UPDATE ON RobloxPlaces
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

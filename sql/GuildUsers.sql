CREATE TABLE IF NOT EXISTS GuildUsers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    guildId VARCHAR(20) NOT NULL,
    robloxId BIGINT UNSIGNED NOT NULL,

    points BIGINT NOT NULL DEFAULT 0,

    notes JSON NOT NULL,
    ranklock JSON NOT NULL,

    FOREIGN KEY (guildId) REFERENCES GuildProfiles(id),
    UNIQUE KEY unique_GuildUser (guildId, robloxId)
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildUsers_BeforeUpdate
BEFORE UPDATE ON GuildUsers
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;
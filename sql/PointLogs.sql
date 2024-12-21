CREATE TABLE IF NOT EXISTS PointLogs (
    id VARCHAR(36) PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    guildId VARCHAR(20) NOT NULL,

    `data` JSON NOT NULL,
    note VARCHAR(1024),

    creatorRobloxId BIGINT UNSIGNED NOT NULL,
    creatorRobloxUsername VARCHAR(20) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (guildId) REFERENCES GuildProfiles(id),
    FOREIGN KEY (creatorRobloxId) REFERENCES UserProfiles(robloxId),
    FOREIGN KEY (creatorRobloxUsername) REFERENCES UserProfiles(robloxUsername)
);

CREATE TRIGGER IF NOT EXISTS trigger_PointLogs_BeforeUpdate
BEFORE UPDATE ON PointLogs
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

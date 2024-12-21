CREATE TABLE IF NOT EXISTS ScheduleEvents (
    id VARCHAR(36) PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    guildId VARCHAR(20) NOT NULL,

    `type` VARCHAR(100) NOT NULL,
    notes VARCHAR(500),
    placeId BIGINT UNSIGNED,

    `time` TIMESTAMP NOT NULL,
    duration INT NOT NULL,

    hostRobloxName VARCHAR(20) NOT NULL,
    hostRobloxId BIGINT UNSIGNED NOT NULL,

    discordEventId VARCHAR(32) NOT NULL,
    robloxEventId VARCHAR(32) NOT NULL,

    FOREIGN KEY (guildId) REFERENCES GuildProfiles(id),
    FOREIGN KEY (hostRobloxId) REFERENCES UserProfiles(robloxId)
);

CREATE TRIGGER IF NOT EXISTS trigger_ScheduleEvents_BeforeUpdate
BEFORE UPDATE ON ScheduleEvents
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

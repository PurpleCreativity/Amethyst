-- This is here internally, currently unused.

CREATE TABLE IF NOT EXISTS ScheduleTypes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,
    
    guildId VARCHAR(20) NOT NULL,
    
    `name` VARCHAR(32) NOT NULL,
    icon VARCHAR(1024) NOT NULL,
    color VARCHAR(20) NOT NULL,
    `description` VARCHAR(500),

    useRobloxSchedule BOOLEAN NOT NULL DEFAULT FALSE,
    useDiscordSchedule BOOLEAN NOT NULL DEFAULT FALSE,

    canScheduleRoles JSON NOT NULL DEFAULT '[]',
    canScheduleUsers JSON NOT NULL DEFAULT '[]',

    FOREIGN KEY (guildId) REFERENCES GuildProfiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_ScheduleTypes_BeforeUpdate
BEFORE UPDATE ON ScheduleTypes
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

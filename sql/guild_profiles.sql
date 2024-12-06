CREATE TABLE IF NOT EXISTS guild_profiles (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v BIGINT UNSIGNED NOT NULL DEFAULT 0,
    
    guild_id BIGINT UNSIGNED UNIQUE NOT NULL,
    shortname VARCHAR(10) NOT NULL UNIQUE,

    permissions JSON NOT NULL DEFAULT '{
        "Administrator":{"users":[],"roles":[]},
        "Moderator":{"users":[],"roles":[]},
        "RobloxModerator":{"users":[],"roles":[]},
        "RobloxGroupManager":{"users":[],"roles":[]},
        "PointsManager":{"users":[],"roles":[]},
        "PointsViewer":{"users":[],"roles":[]},
        "PointLogCreator":{"users":[],"roles":[]},
        "EventScheduler":{"users":[],"roles":[]},
        "ScheduleManager":{"users":[],"roles":[]}
    }',
    channels JSON NOT NULL DEFAULT '{}',

    settings JSON NOT NULL DEFAULT '{}',
    fflags JSON NOT NULL DEFAULT '{}'
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildProfiles_BeforeUpdate
BEFORE UPDATE ON guild_profiles
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

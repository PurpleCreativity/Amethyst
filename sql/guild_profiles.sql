CREATE TABLE IF NOT EXISTS guild_profiles (
    id BIGINT UNSIGNED PRIMARY KEY,
    _v BIGINT UNSIGNED NOT NULL DEFAULT 0,
    
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

    settings JSON NOT NULL DEFAULT '{}'
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildProfiles_BeforeUpdate
BEFORE UPDATE ON guild_profiles
FOR EACH ROW
BEGIN
    SET NEW._v = OLD._v + 1;
END;

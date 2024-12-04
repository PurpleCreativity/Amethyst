CREATE TABLE IF NOT EXISTS guild_profiles (
    id BIGINT UNSIGNED PRIMARY KEY,
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    
    shortname VARCHAR(10) NOT NULL UNIQUE,

    permissions JSON NOT NULL DEFAULT '{}',
    channels JSON NOT NULL DEFAULT '{}',

    settings JSON NOT NULL DEFAULT '{}',
    fflags JSON NOT NULL DEFAULT '{}'
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildProfiles_BeforeUpdate
BEFORE UPDATE ON guild_profiles
FOR EACH ROW
BEGIN
    SET NEW.version = OLD.version + 1;
END;

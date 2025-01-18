CREATE TABLE IF NOT EXISTS GuildProfiles (
    id VARCHAR(20) PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,
    
    shortname VARCHAR(10) NOT NULL UNIQUE,

    permissions JSON NOT NULL,
    channels JSON NOT NULL DEFAULT '{}',

    settings JSON NOT NULL DEFAULT '{}'
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildProfiles_BeforeUpdate
BEFORE UPDATE ON GuildProfiles
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

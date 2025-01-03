-- This is here internally, currently unused.

CREATE TABLE IF NOT EXISTS GuildGroups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    `name` VARCHAR(255) UNIQUE NOT NULL
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildGroups_BeforeUpdate
BEFORE UPDATE ON GuildGroups
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

-- This is here internally, currently unused.

CREATE TABLE IF NOT EXISTS GuildGroupMemberships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v BIGINT UNSIGNED NOT NULL DEFAULT 1,

    groupId BIGINT UNSIGNED NOT NULL,
    guildId VARCHAR(20) NOT NULL,

    settings JSON NOT NULL DEFAULT '{}',

    FOREIGN KEY (groupId) REFERENCES GuildGroups(id),
    FOREIGN KEY (guildId) REFERENCES GuildProfiles(id),

    UNIQUE(groupId, guildId)
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildGroupMemberships_BeforeUpdate
BEFORE UPDATE ON GuildGroupMemberships
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

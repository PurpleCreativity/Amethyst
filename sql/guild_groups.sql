CREATE TABLE IF NOT EXISTS guild_groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    `name` VARCHAR(255) UNIQUE NOT NULL
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildGroups_BeforeUpdate
BEFORE UPDATE ON guild_groups
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

CREATE TABLE IF NOT EXISTS guild_group_memberships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v BIGINT UNSIGNED NOT NULL DEFAULT 1,

    group_id BIGINT UNSIGNED NOT NULL,
    guild_id VARCHAR(20) NOT NULL,

    settings JSON NOT NULL DEFAULT '{}',

    FOREIGN KEY (group_id) REFERENCES guild_groups(id),
    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id),

    UNIQUE(group_id, guild_id)
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildGroupMemberships_BeforeUpdate
BEFORE UPDATE ON guild_group_memberships
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

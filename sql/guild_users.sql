CREATE TABLE IF NOT EXISTS guild_users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,

    guild_id BIGINT UNSIGNED NOT NULL,
    discord_id BIGINT UNSIGNED,
    roblox_id BIGINT UNSIGNED NOT NULL,

    points BIGINT NOT NULL,

    notes JSON NOT NULL DEFAULT '{}',
    ranklock JSON NOT NULL DEFAULT '{}',

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id),
    FOREIGN KEY (discord_id) REFERENCES user_profiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildUsers_BeforeUpdate
BEFORE UPDATE ON guild_users
FOR EACH ROW
BEGIN
    SET NEW.version = OLD.version + 1;
END;

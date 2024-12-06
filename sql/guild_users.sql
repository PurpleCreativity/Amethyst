CREATE TABLE IF NOT EXISTS guild_users (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v BIGINT UNSIGNED NOT NULL DEFAULT 0,

    guild_id BIGINT UNSIGNED NOT NULL,
    roblox_id BIGINT UNSIGNED NOT NULL,

    points BIGINT NOT NULL DEFAULT 0,

    notes JSON NOT NULL,
    ranklock JSON NOT NULL,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(guild_id),
    FOREIGN KEY (discord_id) REFERENCES user_profiles(discord_id)
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildUsers_BeforeUpdate
BEFORE UPDATE ON guild_users
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;
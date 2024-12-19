CREATE TABLE IF NOT EXISTS guild_users (
    id BIGINT UNSIGNED PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    guild_id VARCHAR(20) NOT NULL,

    points BIGINT NOT NULL DEFAULT 0,

    notes JSON NOT NULL,
    ranklock JSON NOT NULL,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildUsers_BeforeUpdate
BEFORE UPDATE ON guild_users
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;
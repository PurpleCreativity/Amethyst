CREATE TABLE IF NOT EXISTS guild_users (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,

    guild_id BIGINT UNSIGNED NOT NULL,
    roblox_id BIGINT UNSIGNED NOT NULL,
    discord_id BIGINT UNSIGNED,

    points BIGINT NOT NULL,

    note JSON NOT NULL,
    ranklock JSON NOT NULL,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id),
    FOREIGN KEY (discord_id) REFERENCES user_profiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_GuildUsers_BeforeInsert
BEFORE INSERT ON guild_users
FOR EACH ROW
BEGIN
    IF NEW.note IS NULL THEN
        SET NEW.note = JSON_OBJECT(
            'enabled', TRUE,
            'entries', JSON_ARRAY()
        );
    END IF;
END;

CREATE TRIGGER IF NOT EXISTS trigger_GuildUsers_BeforeUpdate
BEFORE UPDATE ON guild_users
FOR EACH ROW
BEGIN
    SET NEW.version = OLD.version + 1;
END;
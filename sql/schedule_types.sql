CREATE TABLE IF NOT EXISTS schedule_types (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    _version BIGINT UNSIGNED NOT NULL DEFAULT 1,
    
    guild_profile_id BIGINT UNSIGNED NOT NULL,
    
    `name` VARCHAR(32) NOT NULL,
    icon VARCHAR(1024) NOT NULL,
    color VARCHAR(20) NOT NULL,
    `description` VARCHAR(500),

    use_roblox_schedule BOOLEAN NOT NULL DEFAULT FALSE,
    use_discord_schedule BOOLEAN NOT NULL DEFAULT FALSE,

    can_schedule_roles JSON NOT NULL DEFAULT '{}',
    can_schedule_users JSON NOT NULL DEFAULT '{}',

    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(_id)
);

-- Triggers

CREATE TRIGGER IF NOT EXISTS schedule_types__before
BEFORE UPDATE ON schedule_types
FOR EACH ROW
BEGIN
    SET NEW._version = OLD._version + 1;
END;
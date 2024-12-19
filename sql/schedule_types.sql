CREATE TABLE IF NOT EXISTS schedule_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,
    
    guild_id VARCHAR(20) NOT NULL,
    
    `name` VARCHAR(32) NOT NULL,
    icon VARCHAR(1024) NOT NULL,
    color VARCHAR(20) NOT NULL,
    `description` VARCHAR(500),

    use_roblox_schedule BOOLEAN NOT NULL DEFAULT FALSE,
    use_discord_schedule BOOLEAN NOT NULL DEFAULT FALSE,

    can_schedule_roles JSON NOT NULL DEFAULT '[]',
    can_schedule_users JSON NOT NULL DEFAULT '[]',

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_ScheduleTypes_BeforeUpdate
BEFORE UPDATE ON schedule_types
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

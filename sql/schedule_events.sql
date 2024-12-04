CREATE TABLE IF NOT EXISTS schedule_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,

    guild_id BIGINT UNSIGNED NOT NULL,

    `type` VARCHAR(100) NOT NULL,
    notes VARCHAR(500),
    place_id BIGINT UNSIGNED,

    time TIMESTAMP NOT NULL,
    duration INT NOT NULL,

    host_name VARCHAR(20) NOT NULL,
    host_id BIGINT UNSIGNED NOT NULL,

    discord_event_id VARCHAR(32) NOT NULL,
    roblox_event_id VARCHAR(32) NOT NULL,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id)
);

CREATE TRIGGER IF NOT EXISTS trigger_ScheduleEvents_BeforeUpdate
BEFORE UPDATE ON schedule_events
FOR EACH ROW
BEGIN
    SET NEW.version = OLD.version + 1;
END;

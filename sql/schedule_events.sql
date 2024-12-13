CREATE TABLE IF NOT EXISTS schedule_events (
    id VARCHAR(36) PRIMARY KEY,
    _v BIGINT UNSIGNED NOT NULL DEFAULT 0,

    guild_id BIGINT UNSIGNED NOT NULL,

    `type` VARCHAR(100) NOT NULL,
    notes VARCHAR(500),
    place_id BIGINT UNSIGNED,

    time TIMESTAMP NOT NULL,
    duration INT NOT NULL,

    host_roblox_name VARCHAR(20) NOT NULL,
    host_roblox_id BIGINT UNSIGNED NOT NULL,

    discord_event_id VARCHAR(32) NOT NULL,
    roblox_event_id VARCHAR(32) NOT NULL,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id),
    FOREIGN KEY (host_roblox_id) REFERENCES user_profiles(roblox_id)
);

CREATE TRIGGER IF NOT EXISTS trigger_ScheduleEvents_BeforeUpdate
BEFORE UPDATE ON schedule_events
FOR EACH ROW
BEGIN
    SET NEW._v = OLD._v + 1;
END;

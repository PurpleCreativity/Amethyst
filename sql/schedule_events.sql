CREATE TABLE IF NOT EXISTS schedule_events (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    _v BIGINT UNSIGNED NOT NULL DEFAULT 1,

    guild_profile_id BIGINT UNSIGNED NOT NULL,

    `type` VARCHAR(100) NOT NULL,
    notes VARCHAR(500),
    place_id BIGINT UNSIGNED,

    time TIMESTAMP NOT NULL,
    duration INT NOT NULL,

    host_name VARCHAR(20) NOT NULL,
    host_id BIGINT UNSIGNED NOT NULL,

    discord_event_id VARCHAR(32) NOT NULL,
    roblox_event_id VARCHAR(32) NOT NULL,

    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(_id)
);

-- Triggers

CREATE TRIGGER IF NOT EXISTS schedule_events__before_update
BEFORE UPDATE ON schedule_events
FOR EACH ROW
BEGIN
    SET NEW._v = OLD._v + 1;
END;
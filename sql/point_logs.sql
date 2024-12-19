CREATE TABLE IF NOT EXISTS point_logs (
    id VARCHAR(36) PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    guild_id VARCHAR(20) NOT NULL,

    `data` JSON NOT NULL,
    note VARCHAR(500),

    creator_roblox_id BIGINT UNSIGNED NOT NULL,
    creator_roblox_username VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(id),
    FOREIGN KEY (creator_roblox_id) REFERENCES user_profiles(roblox_id),
    FOREIGN KEY (creator_roblox_username) REFERENCES user_profiles(roblox_username)
);

CREATE TRIGGER IF NOT EXISTS trigger_PointLogs_BeforeUpdate
BEFORE UPDATE ON point_logs
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

CREATE TABLE IF NOT EXISTS point_logs (
    _id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    __v BIGINT UNSIGNED NOT NULL DEFAULT 0,

    id VARCHAR(36) UNIQUE NOT NULL,
    guild_id BIGINT UNSIGNED NOT NULL,

    `data` JSON NOT NULL,
    note VARCHAR(500),

    creator_roblox_id BIGINT UNSIGNED NOT NULL,
    creator_roblox_username VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (guild_id) REFERENCES guild_profiles(guild_id),
    FOREIGN KEY (creator_roblox_id) REFERENCES user_profiles(roblox_id)
);

CREATE TRIGGER IF NOT EXISTS trigger_PointLogs_BeforeUpdate
BEFORE UPDATE ON point_logs
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

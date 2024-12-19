CREATE TABLE IF NOT EXISTS user_profiles (
    id VARCHAR(20) PRIMARY KEY,
    __v INT UNSIGNED NOT NULL DEFAULT 1,

    roblox_id BIGINT UNSIGNED UNIQUE,
    roblox_username VARCHAR(20) UNIQUE,

    settings JSON NOT NULL DEFAULT '{}'
);

CREATE TRIGGER IF NOT EXISTS trigger_UserProfiles_BeforeUpdate
BEFORE UPDATE ON user_profiles
FOR EACH ROW
BEGIN
    SET NEW.__v = OLD.__v + 1;
END;

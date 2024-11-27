CREATE TABLE IF NOT EXISTS api_keys (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    guild_profile_id BIGINT UNSIGNED NOT NULL,

    key_name VARCHAR(20) NOT NULL,
    key_value VARCHAR(100) NOT NULL,
    key_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    key_permissions JSON NOT NULL DEFAULT '{}',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED NOT NULL,

    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id),
    FOREIGN KEY (created_by) REFERENCES user_profiles(id)
);
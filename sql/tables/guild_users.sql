CREATE TABLE IF NOT EXISTS guild_users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    guild_profile_id BIGINT UNSIGNED NOT NULL,
    user_profile_id BIGINT UNSIGNED NOT NULL,

    points INT NOT NULL,

    note_content VARCHAR(500),
    note_visible BOOLEAN NOT NULL DEFAULT TRUE,
    note_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    ranklock_rank INT UNSIGNED NOT NULL DEFAULT 0,
    ranklock_shadow BOOLEAN NOT NULL DEFAULT FALSE,
    ranklock_reason VARCHAR(500),
    ranklock_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id),
    FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id)
);
import fs from "node:fs";
import path from "node:path";
import { Guild, type Snowflake, User } from "discord.js";
import mariadb, { SqlError } from "mariadb";
import type Client from "../classes/Client.ts";
import GuildProfile, { type PermissionEntry } from "../classes/database/GuildProfile.js";
import GuildUser from "../classes/database/GuildUser.js";
import PointLog from "../classes/database/PointLog.js";
import UserProfile from "../classes/database/UserProfile.js";
import type { PointLogQueryOptions } from "../types/core/Database.js";
import { CommandPermission } from "../types/core/Interactables.js";

export default class Database {
    client: Client;
    private pool: mariadb.Pool;
    readonly loadingOrder = [
        "UserProfiles",
        "GuildProfiles",

        "GuildUsers",
        "GuildGroups",
        "RobloxPlaces",
        "APIKeys",
        "PointLogs",

        "ScheduleTypes",
        "ScheduleEvents",
    ];

    constructor(client: Client) {
        this.client = client;
        this.pool = mariadb.createPool(client.config.credentials.database);
    }

    //? Internal Methods

    getConnection = async (): Promise<mariadb.Connection> => {
        try {
            return await this.pool.getConnection();
        } catch (error) {
            if (!(error instanceof SqlError)) throw new Error("Unknown error");

            this.client.error(`Failed to get database connection: ${error.sqlMessage}`);
            throw error;
        }
    };

    private initializeTables = async () => {
        const filesPath = path.join(process.cwd(), "sql");
        const connection = await this.getConnection();

        try {
            await connection.beginTransaction();

            for (const tableName of this.loadingOrder) {
                const filePath = path.join(filesPath, `${tableName}.sql`);

                if (fs.existsSync(filePath)) {
                    const sql = fs.readFileSync(filePath, "utf-8");

                    await connection.query(sql);

                    this.client.verbose(`Initialized table: ${tableName}`);
                } else {
                    this.client.warn(`SQL file for table '${tableName}' not found: ${filePath}`);
                }
            }

            await connection.commit();
            this.client.success("Initialized Database tables");
        } catch (error) {
            this.client.error("There was an error initializing the Database tables:");
            this.client.error(error);
            await connection.rollback();

            process.exit(1);
        } finally {
            await connection.end();
        }
    };

    //? Data handling

    addUserProfile = async (discordUser: User | string | Snowflake) => {
        if (typeof discordUser === "string") discordUser = (await this.client.Functions.fetchUser(discordUser)) as User;
        if (!discordUser || !(discordUser instanceof User)) throw new Error("Unknown user.");

        const profile = new UserProfile({
            id: discordUser.id,
            __v: 0,

            robloxId: null,
            robloxUsername: null,

            settings: {},
        });

        await profile.save();
        return profile;
    };

    getUserProfile = async (discordId: string) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            const existing = await connection.query("SELECT * FROM UserProfiles WHERE id = ?", [discordId]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new UserProfile(rawdata);
            }

            await this.addUserProfile(discordId);
            const rawdata = (await connection.query("SELECT * FROM UserProfiles WHERE id = ?", [discordId]))[0];

            return new UserProfile(rawdata);
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };

    addGuildProfile = async (shortname: string, guild: Guild | string | Snowflake) => {
        if (typeof guild === "string") guild = (await this.client.Functions.fetchGuild(guild)) as Guild;
        if (!guild || !(guild instanceof Guild)) throw new Error("Guild not found.");

        const profile = new GuildProfile({
            id: guild.id,
            __v: 0,
            shortname: shortname,

            permissions: {
                [CommandPermission.Administrator]: { users: [], roles: [] },
                [CommandPermission.RobloxModerator]: { users: [], roles: [] },
                [CommandPermission.RobloxCommunityManager]: { users: [], roles: [] },
                [CommandPermission.PointsManager]: { users: [], roles: [] },
                [CommandPermission.PointsViewer]: { users: [], roles: [] },
                [CommandPermission.PointlogCreator]: { users: [], roles: [] },
                [CommandPermission.EventScheduler]: { users: [], roles: [] },
                [CommandPermission.ScheduleManager]: { users: [], roles: [] },
            } as Record<CommandPermission, PermissionEntry>,
            channels: {},
            settings: {},
        });

        await profile.save();
        return profile;
    };

    getGuildProfile = async (guildId: string) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            const existing = await connection.query("SELECT * FROM GuildProfiles WHERE id = ?", [guildId]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new GuildProfile(rawdata);
            }

            return undefined;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };

    private addGuildUserProfile = async (guildId: string, robloxId: number) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();

            await connection.query(
                `INSERT INTO GuildUsers (guildId, robloxId, notes, ranklock)
                VALUES (?, ?, ?, ?)`,
                [
                    guildId,
                    robloxId,

                    JSON.stringify([]),
                    JSON.stringify({
                        rank: 0,
                        reason: null,
                        shadow: false,
                    }),
                ],
            );

            const rawdata = (
                await connection.query("SELECT * FROM GuildUsers WHERE guildId = ? AND robloxId = ?", [
                    guildId,
                    robloxId,
                ])
            )[0];

            const profile = new GuildUser(rawdata);
            return profile;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };

    getGuildUserProfile = async (guildId: string, robloxId: number) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            const existing = await connection.query("SELECT * FROM GuildUsers WHERE guildId = ? AND robloxId = ?", [
                guildId,
                robloxId,
            ]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new GuildUser(rawdata);
            }

            await this.addGuildUserProfile(guildId, robloxId);
            const rawdata = (
                await connection.query("SELECT * FROM GuildUsers WHERE guildId = ? AND robloxId = ?", [
                    guildId,
                    robloxId,
                ])
            )[0];

            return new GuildUser(rawdata);
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };

    getPointlogs = async (options: PointLogQueryOptions) => {
        let connection: mariadb.Connection | undefined;
        const pointlogs: PointLog[] = [];

        try {
            connection = await this.getConnection();

            const conditions: string[] = [];
            const values: unknown[] = [];

            if (options.guildId) {
                conditions.push("PointLogs.guildId = ?");
                values.push(options.guildId);
            }

            if (options.creatorRobloxId) {
                conditions.push("PointLogs.creatorRobloxId = ?");
                values.push(options.creatorRobloxId);
            }

            if (options.createdAfter) {
                conditions.push("PointLogs.createdAt >= ?");
                values.push(options.createdAfter);
            }

            if (options.createdBefore) {
                conditions.push("PointLogs.createdAt <= ?");
                values.push(options.createdBefore);
            }

            if (options.includedUserSearcher) {
                if (typeof options.includedUserSearcher === "number") {
                    // Filter by robloxId
                    conditions.push("jt.robloxId = ?");
                    values.push(options.includedUserSearcher);
                } else {
                    // Filter by robloxUsername
                    conditions.push("jt.robloxUsername = ?");
                    values.push(options.includedUserSearcher);
                }
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
            const limitOffsetClause = "LIMIT ? OFFSET ?";

            values.push(options.limit || 10);
            values.push(options.offset || 0);

            const query = `
                SELECT DISTINCT PointLogs.*
                FROM PointLogs
                JOIN JSON_TABLE(
                    PointLogs.data, '$[*]'
                    COLUMNS (
                        points INT PATH '$.points',
                        robloxId BIGINT PATH '$.user.robloxId',
                        robloxUsername VARCHAR(255) PATH '$.user.robloxUsername'
                    )
                ) AS jt
                ${whereClause}
                ${limitOffsetClause}
            `;

            const rows = await connection.query(query, values);

            for (const row of rows) {
                pointlogs.push(new PointLog(row));
            }
        } finally {
            if (connection) connection.end();
        }

        return pointlogs;
    };

    init = async () => {
        if (this.client.devMode) await this.initializeTables();

        //await this.addGuildProfile("DEV", "1276574166937505925");
        this.client.success("Initialized Database");
    };
}

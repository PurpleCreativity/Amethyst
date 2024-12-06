import type { GuildMember } from "discord.js";
import type mariadb from "mariadb";
import client from "../../main.js";
import type { ValidPermissions } from "../../types/shared.js";

export type PermissionEntry = {
    users: Array<string>;
    roles: Array<string>;
};

export type rawGuildData = {
    _id: bigint;
    __v: bigint;

    guild_id: bigint;
    shortname: string;

    permissions: Record<string, PermissionEntry>;
    channels: Record<string, string>;

    settings: Record<string, unknown>;
    fflags: Record<string, unknown>;
};

export default class GuildProfile {
    readonly _id: bigint;
    __v: bigint;

    readonly guildId: string;
    readonly shortname: string;

    readonly permissions: Record<ValidPermissions, PermissionEntry>;
    readonly channels: Record<string, string>;

    readonly settings: Record<string, unknown>;
    readonly fflags: Record<string, unknown>;

    constructor(rawdata: rawGuildData) {
        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guild_id.toString();
        this.shortname = rawdata.shortname;

        this.permissions = rawdata.permissions;
        this.channels = rawdata.channels;

        this.settings = rawdata.settings;
        this.fflags = rawdata.fflags;
    }

    getSetting = (key: string): unknown => {
        return this.settings[key];
    };

    setSetting = (key: string, value: unknown): void => {
        this.settings[key] = value;
    };

    getFFlag = (key: string): unknown => {
        return this.fflags[key];
    };

    setFFlag = (key: string, value: unknown): void => {
        this.fflags[key] = value;
    };

    getPermission = (name: ValidPermissions): PermissionEntry | undefined => {
        return this.permissions[name];
    };

    addUsersToPermission = (name: ValidPermissions, userIds: string | string[]): void => {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const userArray = Array.isArray(userIds) ? userIds : [userIds];
        permission.users = [...new Set([...permission.users, ...userArray])];
    };

    addRolesToPermission = (name: ValidPermissions, roleIds: string | string[]): void => {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const roleArray = Array.isArray(roleIds) ? roleIds : [roleIds];
        permission.roles = [...new Set([...permission.roles, ...roleArray])];
    };

    removeUsersFromPermission = (name: ValidPermissions, userIds: string | string[]): void => {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const userArray = Array.isArray(userIds) ? userIds : [userIds];
        permission.users = permission.users.filter((userId) => !userArray.includes(userId));
    };

    removeRolesFromPermission = (name: ValidPermissions, roleIds: string | string[]): void => {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const roleArray = Array.isArray(roleIds) ? roleIds : [roleIds];
        permission.roles = permission.roles.filter((roleId) => !roleArray.includes(roleId));
    };

    checkPermissions = (guildMember: GuildMember, requiredPermissions: ValidPermissions[]): boolean => {
        if (requiredPermissions.length === 0) return true;
        if (guildMember.permissions.has("Administrator")) return true;

        const roles = new Set(guildMember.roles.cache.map((role) => role.id));

        const adminPermission = this.getPermission("Administrator");
        if (adminPermission) {
            if (adminPermission.users.includes(guildMember.id)) return true;
            if (adminPermission.roles.some((roleId) => roles.has(roleId))) return true;
        }

        let ownedPermissionsCount = 0;

        for (const permissionName of requiredPermissions) {
            const permission = this.getPermission(permissionName);
            if (!permission) continue;

            if (permission.users.includes(guildMember.id)) {
                ownedPermissionsCount++;
                continue;
            }

            if (permission.roles.some((roleId) => roles.has(roleId))) {
                ownedPermissionsCount++;
            }
        }

        return ownedPermissionsCount === requiredPermissions.length;
    };

    save = async (): Promise<void> => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            await connection.beginTransaction();

            const result = await connection.query(
                `UPDATE guild_profiles 
                 SET permissions = ?, channels = ?, settings = ?, fflags = ? 
                 WHERE _id = ? AND __v = ?`,
                [
                    JSON.stringify(this.permissions),
                    JSON.stringify(this.channels),
                    JSON.stringify(this.settings),
                    JSON.stringify(this.fflags),
                    this._id,
                    this.__v,
                ],
            );

            if (result.affectedRows === 0) {
                throw new Error("Save failed: The record was modified or does not exist.");
            }

            await connection.commit();
            this.__v = BigInt(this.__v) + 1n;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };
}

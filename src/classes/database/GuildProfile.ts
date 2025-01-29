import type { GuildMember } from "discord.js";
import type mariadb from "mariadb";
import client from "../../main.js";
import { CommandPermission } from "../../types/core/Interactables.js";

export type PermissionEntry = {
    users: Array<string>;
    roles: Array<string>;
};

export type rawGuildData = {
    id: string;
    __v: number;

    shortname: string;

    permissions: Record<CommandPermission, PermissionEntry>;
    channels: Record<string, string>;
    settings: Record<string, unknown>;
};

export default class GuildProfile {
    readonly id: string;
    private __v: number;

    readonly shortname: string;

    readonly permissions: Record<CommandPermission, PermissionEntry>;
    readonly channels: Record<string, string>;

    readonly settings: Record<string, unknown>;

    constructor(rawdata: rawGuildData) {
        this.id = rawdata.id;
        this.__v = rawdata.__v;

        this.shortname = rawdata.shortname;

        this.permissions = rawdata.permissions;
        this.channels = rawdata.channels;
        this.settings = rawdata.settings;
    }

    getSetting(key: string): unknown {
        return this.settings[key];
    }

    setSetting(key: string, value: unknown): void {
        this.settings[key] = value;
    }

    getPermission(name: CommandPermission): PermissionEntry | undefined {
        return this.permissions[name];
    }

    addUsersToPermission(name: CommandPermission, userIds: string | string[]): void {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const userArray = Array.isArray(userIds) ? userIds : [userIds];
        permission.users = [...new Set([...permission.users, ...userArray])];
    }

    addRolesToPermission(name: CommandPermission, roleIds: string | string[]): void {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const roleArray = Array.isArray(roleIds) ? roleIds : [roleIds];
        permission.roles = [...new Set([...permission.roles, ...roleArray])];
    }

    removeUsersFromPermission(name: CommandPermission, userIds: string | string[]): void {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const userArray = Array.isArray(userIds) ? userIds : [userIds];
        permission.users = permission.users.filter((userId) => !userArray.includes(userId));
    }

    removeRolesFromPermission(name: CommandPermission, roleIds: string | string[]): void {
        const permission = this.permissions[name];
        if (!permission) {
            throw new Error(`Permission "${name}" does not exist.`);
        }

        const roleArray = Array.isArray(roleIds) ? roleIds : [roleIds];
        permission.roles = permission.roles.filter((roleId) => !roleArray.includes(roleId));
    }

    checkPermissions(guildMember: GuildMember, requiredPermissions: CommandPermission[]): boolean {
        if (requiredPermissions.length === 0) return true;
        if (guildMember.permissions.has("Administrator")) return true;
        if (client.Functions.isDev(guildMember.user.id)) return true;

        const roles = new Set(guildMember.roles.cache.map((role) => role.id));

        const adminPermission = this.getPermission(CommandPermission.Administrator);
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
    }

    async save(): Promise<void> {
        client.Database.runTransaction(async (connection) => {
            const result = await connection.query(
                `INSERT INTO GuildProfiles (id, shortname, permissions, channels, settings)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    permissions = VALUES(permissions),
                    channels = VALUES(channels),
                    settings = VALUES(settings)`,
                [
                    this.id,
                    this.shortname,
                    JSON.stringify(this.permissions),
                    JSON.stringify(this.channels),
                    JSON.stringify(this.settings),
                ],
            );

            if (result.affectedRows === 0) {
                throw new Error("Save failed: The record was modified or does not exist.");
            }
            this.__v += 1;
        });
    }
}

export type PointLogQueryOptions = Partial<{
    guildId: string;
    creatorRobloxId: number;
    includedUserSearcher: number | string; // number is id, string is username
    createdAfter: Date;
    createdBefore: Date;
    limit: number;
    offset: number;
}>;

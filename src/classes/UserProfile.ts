export type RawUserData = {
    IV: string;

    Id: string;
    Name: string;

    RobloxId: bigint | null;
    RobloxUsername: string | null;
    RobloxUpdatedAt: Date;

    FFlags: Record<string, unknown>;
    Settings: Record<string, unknown>;

    CreatedAt: Date;
};

export default class UserProfile {
    rawdata: RawUserData;

    constructor(rawdata: RawUserData) {
        this.rawdata = rawdata;
    }
}

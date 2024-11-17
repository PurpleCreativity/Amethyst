import mongoose from "mongoose";

interface userProfileInterface extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    iv: string;

    user: {
        id: string;
        name: string;
    };

    roblox: {
        user:
            | {
                  id: string;
                  name: string;
              }
            | undefined;
        updatedAt: Date | undefined;
    };

    FFlags: Map<string, unknown>;
    settings: Map<string, unknown>;

    linkRoblox: (robloxUser: { id: number; name: string }) => void;
    
    getFFlag: (name: string) => unknown;
    setFFlag: (name: string, value: unknown) => void;

    getSetting: (name: string) => unknown;
    setSetting: (name: string, value: unknown) => void;
}

const userProfileSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv: { type: String, unique: true, required: true },

    user: {
        id: { type: String, unique: true, required: true },
        name: { type: String, required: true },
    },

    roblox: {
        user: {
            id: { type: String, unique: true, required: false },
            name: { type: String, required: false },
        },
        updatedAt: { type: Date, default: undefined, required: false },
    },

    FFlags: { type: Map, of: mongoose.Schema.Types.Mixed },
    settings: { type: Map, of: mongoose.Schema.Types.Mixed },
});

userProfileSchema.methods.linkRoblox = function (robloxUser: { id: number; name: string }) {
    this.roblox.user = robloxUser;
    this.roblox.updatedAt = new Date();
};

userProfileSchema.methods.getFFlag = function (name: string) {
    return this.FFlags.get(name);
};

userProfileSchema.methods.setFFlag = function (name: string, value: unknown) {
    this.FFlags.set(name, value);
};

userProfileSchema.methods.getSetting = function (name: string) {
    return this.settings.get(name);
};

userProfileSchema.methods.setSetting = function (name: string, value: unknown) {
    this.settings.set(name, value);
};

const userProfile = mongoose.model<userProfileInterface>("userProfile", userProfileSchema);

export default userProfile;
export type { userProfileInterface, userProfileSchema };

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

const userProfile = mongoose.model<userProfileInterface>("User", userProfileSchema);

export default userProfile;
export type { userProfileInterface, userProfileSchema };

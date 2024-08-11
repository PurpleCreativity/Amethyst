import mongoose from "mongoose";
import client from "../index.js";
import type { User } from "wrapblox";

type Setting = {
    name: string,
    description: string,
    value: any,
}

interface userProfileInterface extends mongoose.Document {
    _id: mongoose.Types.ObjectId,
    iv: string,

    user: {
        id: string,
        name: string,
    },

    roblox: {
        username: string,
        id: number,
    }

    settings: Map<string, Setting>,

    linkRoblox: (robloxUser: User) => Promise<void>,
}

const userProfileSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv: String,

    user: {
        id: String,
        name: String,
    },

    roblox: {
        username: String,
        id: Number,
    },

    settings: {
        type: Map,
        of: {
            name: String,
            description: String,
            value: mongoose.Schema.Types.Mixed,
        }
    }
});

userProfileSchema.methods.linkRoblox = async function (robloxUser:User) {
    this.roblox.username = robloxUser.name;
    this.roblox.id = robloxUser.id;
    
    await this.save();
}

const userProfile = mongoose.model("userProfile", userProfileSchema);

export default userProfile;
export type { userProfileInterface, Setting };
import type { PlayerInfo as nbPlayerInfo } from "noblox.js";

export type PlayerInfo = nbPlayerInfo & {
    id: number;
    description: string;
};

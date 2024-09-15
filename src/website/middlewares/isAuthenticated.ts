import type { Request, Response, NextFunction } from 'express';
import type { userProfileInterface } from '../../schemas/userProfile.js';

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as userProfileInterface;

    if (!user) {
        return res.status(401).redirect("/api/v1/auth/discord/redirect");
    }

    if (user.roblox.id === 0) {
        return res.status(401).redirect("/api/v1/auth/roblox/redirect");
    }

    return next();
};

const isAuthenticatedDiscord = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as userProfileInterface;

    if (!user) {
        res.status(401).send("/api/v1/auth/discord/redirect");
    }

    return next();
}

export default isAuthenticated;
export { isAuthenticatedDiscord };
import type { Request, Response, NextFunction } from 'express';

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => req.user ? next() : res.status(401).redirect("/api/v1/auth/discord/redirect");

export default isAuthenticated;
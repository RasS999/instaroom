// filepath: c:\xampp\htdocs\InstaRoom\utils\sessionHandler.js
import { withIronSessionApiRoute } from 'iron-session/next';

export const sessionOptions = {
    password: process.env.SESSION_PASSWORD || 'a_secure_password_with_at_least_32_characters',
    cookieName: 'instaroom_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};

export function withSession(handler) {
    return withIronSessionApiRoute(handler, sessionOptions);
}
import { withSession } from '../../utils/sessionHandler'; // Optional utility for session handling

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId, email, userLevel, fullName } = req.body;

        if (!userId || !email) {
            return res.status(400).json({ error: 'Invalid session data.' });
        }

        // Set session data
        req.session.user = {
            userId,
            email,
            userLevel,
            fullName,
        };

        return res.status(200).json({ message: 'Session set successfully.' });
    } else {
        return res.status(405).json({ error: 'Method not allowed.' });
    }
}

import { withIronSessionApiRoute } from 'iron-session/next';

export const sessionOptions = {
    password: 'complex_password_at_least_32_characters_long',
    cookieName: 'instaroom_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};

export function withSession(handler) {
    return withIronSessionApiRoute(handler, sessionOptions);
}
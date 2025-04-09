import { withSession } from '../../utils/sessionHandler';

export default withSession(async function handler(req, res) {
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
        await req.session.save(); // Save the session

        return res.status(200).json({ message: 'Session set successfully.' });
    } else {
        return res.status(405).json({ error: 'Method not allowed.' });
    }
});

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
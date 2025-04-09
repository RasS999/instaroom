import { withSession } from '../utils/sessionHandler'; 

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

        // Save the session
        try {
            await req.session.save();
            return res.status(200).json({ message: 'Session set successfully.' });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to save session data.' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed.' });
    }
});
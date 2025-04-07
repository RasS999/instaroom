// middlewares/authMiddleware.js

module.exports = (req, res, next) => {
    if (!req.session || !req.session.user) {
        // Set a flag to indicate authentication failure
        req.session.authError = 'You must be logged in to access this page.';
        return res.redirect('/login'); // Redirect to login page if not authenticated
    }
    next();
};

const app = require('./server');

// Vercel-specific export
module.exports = (req, res) => {
    return app(req, res);
};

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    console.error('Error: JWT_SECRET is not set in the .env file.');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Attach decoded payload to request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(403).json({ message: 'Invalid Token!' });
    }
};

// Generate JWT Token route
app.post('/api/login', (req, res) => {
    const payload = { app: 'iTunesSearchApp' };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' }); // Token expires in 1 hour
    res.json({ token });
});

// iTunes Search Route with JWT protection
app.get('/api/search', verifyToken, async (req, res) => {
    const { term, media } = req.query;

    if (!term) {
        return res.status(400).json({ message: 'Search term is required.' });
    }

    try {
        const encodedTerm = encodeURIComponent(term);
        const requestURL = `https://itunes.apple.com/search?term=${encodedTerm}&media=${media || 'all'}&limit=20`;

        console.log('Request URL:', requestURL);

        const response = await axios.get(requestURL, {
            headers: {
                'User-Agent': 'iTunesSearchApp/1.0',
            },
        });

        if (response.data && response.data.results) {
            res.json({ results: response.data.results });
        } else {
            res.status(500).json({ message: 'Invalid response from iTunes API.' });
        }
    } catch (error) {
        console.error('iTunes API Error:', error.message);
        res.status(500).json({
            message: 'Error fetching data from iTunes API.',
            error: error.message,
        });
    }
});

// Root Route
app.get('/', (req, res) => {
    res.send('iTunes Search API is running.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

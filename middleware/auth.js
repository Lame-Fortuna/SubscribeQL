import jwt from "jsonwebtoken"

// Middleware to verify JWT

const JWT_SECRET = 'lmao'

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]

    if (!token) {
        return res.status(403).send('Token is required')
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err)
            return res.status(401).send('Invalid or expired token')
        }
        req.user = decoded; // Add decoded user info to request

        if (decoded.userId != req.params.userId)
            return res.status(402).send('Unauthorized')

        next()
    });
};
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { oAuth2Client } = require('../utils/googleAuth');
const fetch = require('node-fetch');

const googleClient = new oAuth2Client(process.env.GOOGLE_CLIENT_ID);
const facebookClient = process.env.FACEBOOK_CLIENT_ID;

router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { email, name, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                googleId: ticket.getId(),
                displayName: name,
                email,
                image: picture
            });
            await user.save();
        }

        req.session.user = user;
        res.status(200).json(user);
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
});
router.post('/facebook', async (req, res) => {
    const { accessToken } = req.body;

    try {
        const response = await fetch(`https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${accessToken}`);
        const data = await response.json();

        if (!data.email) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let user = await User.findOne({ email: data.email });

        if (!user) {
            user = new User({
                facebookId: data.id,
                displayName: data.name,
                email: data.email,
                image: data.picture.data.url
            });
            await user.save();
        }

        req.session.user = user;
        res.status(200).json(user);
    } catch (error) {
        console.error('Error verifying Facebook token:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
});
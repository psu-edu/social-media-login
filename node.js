// Google token verification using google-auth-library

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('YOUR_GOOGLE_CLIENT_ID');

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: 'YOUR_GOOGLE_CLIENT_ID',
    });
    const payload = ticket.getPayload();
    return {
        email: payload.email,
        userId: payload.sub,
        firstName: payload.given_name,
        lastName: payload.family_name
    };
}

// Facebook Token verification
const fetch = require('node-fetch');

async function verifyFacebookToken(accessToken) {
    const response = await fetch(`https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${accessToken}`);
    const data = await response.json();
    return {
        email: data.email,
        userId: data.id,
        firstName: data.first_name,
        lastName: data.last_name
    };
}


// Netlify Serverless Function: Verify Password
// Endpoint: /.netlify/functions/verify-password or /api/verify-password (via redirect)

const crypto = require('crypto');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method Not Allowed'
      })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const inputPassword = (body.password || '').toString().trim();

    // Default password '258025', or can be overridden via Netlify Environment Variable 'SHEET_PASSWORD'
    const correctPassword = process.env.SHEET_PASSWORD || '258025';

    if (inputPassword === correctPassword) {
      const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Password verified',
          token: token
        })
      };
    } else {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid password'
        })
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Invalid request body'
      })
    };
  }
};

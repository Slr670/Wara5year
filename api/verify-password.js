// Vercel Serverless Function: /api/verify-password
import crypto from 'crypto';

export default async function handler(req, res) {
  // Support Netlify handler call signature if used as Netlify function
  if (req && !res && req.httpMethod) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (req.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (req.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
      };
    }

    try {
      const body = req.body ? JSON.parse(req.body) : {};
      const inputPassword = (body.password || '').toString().trim();
      const correctPassword = process.env.SHEET_PASSWORD || '258025';

      if (inputPassword === correctPassword) {
        const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Password verified', token })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: 'Invalid password' })
        };
      }
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid request body' })
      };
    }
  }

  // Standard Vercel req/res handler
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const inputPassword = (body.password || '').toString().trim();
    const correctPassword = process.env.SHEET_PASSWORD || '258025';

    if (inputPassword === correctPassword) {
      const token = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      return res.status(200).json({
        success: true,
        message: 'Password verified',
        token: token
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body'
    });
  }
}

export { handler };

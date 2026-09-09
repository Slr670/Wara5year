// Vercel Serverless Function: /api/health
export default async function handler(req, res) {
  if (req && !res && req.httpMethod) {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        status: 'ok',
        time: new Date().toISOString(),
        service: 'Wara-Dashboard-Backend'
      })
    };
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
    service: 'Wara-Dashboard-Vercel-Backend'
  });
}

export { handler };

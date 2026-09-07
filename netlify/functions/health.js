// Netlify Serverless Function: Health Check
// Endpoint: /.netlify/functions/health or /api/health (via redirect)

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      status: 'ok',
      time: new Date().toISOString(),
      service: 'Wara-Dashboard-Netlify-Backend'
    })
  };
};

// api/health.js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'DeepSeek API Proxy',
    timestamp: new Date().toISOString(),
    endpoints: ['POST /api/deepseek', 'GET /api/health']
  });
}
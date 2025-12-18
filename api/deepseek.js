export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // 从环境变量获取API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    // 验证API Key
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // 获取请求数据
    const requestData = req.body;
    
    // 验证必要字段
    if (!requestData || !requestData.messages) {
      return res.status(400).json({ error: 'Missing required field: messages' });
    }
    
    // 构建DeepSeek请求
    const deepseekRequest = {
      model: requestData.model || 'deepseek-chat',
      messages: requestData.messages,
      temperature: requestData.temperature || 0.7,
      max_tokens: requestData.max_tokens || 2000,
      stream: false,
    };
    
    console.log('Proxying to DeepSeek:', { model: deepseekRequest.model });
    
    // 转发请求到DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(deepseekRequest),
    });
    
    // 获取响应
    const data = await response.json();
    
    // 返回响应
    return res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
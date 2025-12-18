// api/deepseek.js
export default async function handler(req, res) {
  // 1. 设置CORS头部，允许所有来源访问（生产环境建议指定域名）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 预检请求缓存24小时

  // 2. 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 4. 只允许特定路径（可选，增加安全性）
  if (req.url !== '/api/deepseek' && req.url !== '/') {
    return res.status(404).json({ error: 'Endpoint not found. Use /api/deepseek' });
  }

  try {
    // 5. 获取请求数据
    const requestData = req.body;

    // 6. 验证必要字段
    if (!requestData || !requestData.messages) {
      return res.status(400).json({ error: 'Missing required field: messages' });
    }

    // 7. 从环境变量获取API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 8. 准备DeepSeek API请求
    const deepseekRequestBody = {
      model: requestData.model || 'deepseek-chat',
      messages: requestData.messages,
      temperature: requestData.temperature || 0.7,
      max_tokens: requestData.max_tokens || 2000,
      stream: false, // 强制关闭流式响应
    };

    console.log('Forwarding request to DeepSeek:', {
      model: deepseekRequestBody.model,
      messageCount: deepseekRequestBody.messages.length,
    });

    // 9. 转发请求到DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(deepseekRequestBody),
    });

    // 10. 获取响应
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', responseText);
      return res.status(502).json({ 
        error: 'Invalid response from DeepSeek API',
        details: responseText.slice(0, 200) 
      });
    }

    // 11. 检查DeepSeek API错误
    if (!response.ok) {
      console.error('DeepSeek API error:', responseData);
      return res.status(response.status).json({
        error: 'DeepSeek API error',
        details: responseData.error || responseData,
      });
    }

    // 12. 成功返回
    console.log('Successfully proxied request');
    return res.status(200).json(responseData);

  } catch (error) {
    // 13. 异常处理
    console.error('Proxy server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

import { N8nConfig } from '../types';

export const sendMessageToN8n = async (
  config: N8nConfig,
  text: string
): Promise<string> => {
  if (!config.webhookUrl) {
    throw new Error('n8n Webhook URL is not configured.');
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [config.payloadKey]: text,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n error (${response.status}): ${errorText || 'Unknown error'}`);
    }

    const contentType = response.headers.get('content-type');
    const rawText = await response.text();

    // If the response is not JSON, or if parsing as JSON fails, return the raw text
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(rawText);
        
        // Attempt to find the response content based on user configuration
        // Often n8n returns an array or a specific key
        const result = Array.isArray(data) ? data[0] : data;
        
        // Extract output based on config or common keys
        const output = result[config.responseKey] || result.output || result.message || result;

        if (typeof output === 'string') {
          return output;
        }
        return JSON.stringify(output, null, 2);
      } catch (jsonError) {
        // Fallback to raw text if JSON parsing fails despite the header
        return rawText;
      }
    }

    // Default fallback: return the raw text directly (handles text/plain, etc.)
    return rawText;
  } catch (error) {
    console.error('Failed to connect to n8n:', error);
    throw error;
  }
};

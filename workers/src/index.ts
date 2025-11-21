import { UserAgent } from './durable-objects/UserAgent';
import { Env } from './types';

export { UserAgent };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname.startsWith('/api/user/')) {
      const userId = url.searchParams.get('userId') || 'demo';

      const id = env.USER_AGENT.idFromName(userId);
      const stub = env.USER_AGENT.get(id);

      const response = await stub.fetch(request);

      const newResponse = new Response(response.body, response);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });

      return newResponse;
    }

    return new Response('Not Found', { status: 404 });
  }
};

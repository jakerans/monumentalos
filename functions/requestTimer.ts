import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const start = performance.now();
  const { endpoint } = await req.json();

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await base44.functions.invoke(endpoint, {});
  const duration = Math.round(performance.now() - start);

  console.log(`[timer] ${endpoint} — ${duration}ms`);

  return Response.json({
    endpoint,
    duration_ms: duration,
    status: result.status,
    timestamp: new Date().toISOString(),
  });
});
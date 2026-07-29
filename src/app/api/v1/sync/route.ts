import { NextResponse } from 'next/server';
import { executeDataSync } from '@/modules/data-integration/push-engine/sync.service';

/**
 * POST /api/v1/sync
 * 
 * Layer 2 API Intermediary endpoint.
 * Acts as a webhook receiver to trigger the Layer 3 Push Engine.
 * 
 * Security: Requires a secret token in the Authorization header to prevent unauthorized syncs.
 */
export async function POST(request: Request) {
  try {
    // 1. Security: Token Validation
    const authHeader = request.headers.get('authorization');
    const EXPECTED_TOKEN = process.env.SYNC_SECRET_TOKEN || 'local-dev-secret';

    if (!authHeader || authHeader !== `Bearer ${EXPECTED_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Trigger the Push Engine
    const result = await executeDataSync();

    if (result.success) {
      return NextResponse.json({ message: 'Sync successful', timestamp: result.timestamp }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Sync failed', details: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

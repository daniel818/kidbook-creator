import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateQuota } from '@/lib/quota';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quota = await calculateQuota(user.id, supabase);
    return NextResponse.json({ quota });
  } catch (error) {
    console.error('Quota check failed:', error);
    return NextResponse.json({ error: 'Failed to check quota' }, { status: 500 });
  }
}

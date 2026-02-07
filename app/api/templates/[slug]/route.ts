// ============================================
// Story Templates API - Single Template Detail
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { mapDbRowToTemplate } from '@/lib/templates';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const { slug } = params;
    const locale = new URL(request.url).searchParams.get('locale') || 'en';

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('story_templates')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const template = mapDbRowToTemplate(data, locale);

    // Fetch related templates (same category, different slug)
    const { data: relatedData } = await supabase
      .from('story_templates')
      .select('*')
      .eq('status', 'published')
      .eq('category', data.category)
      .neq('slug', slug)
      .order('popularity_score', { ascending: false })
      .limit(4);

    const related = (relatedData || []).map(row => mapDbRowToTemplate(row, locale));

    return NextResponse.json({
      template,
      related,
    });
  } catch (error) {
    console.error('Template detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

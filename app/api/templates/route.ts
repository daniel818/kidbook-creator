// ============================================
// Story Templates API - List
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { mapDbRowToTemplate } from '@/lib/templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const audience = searchParams.get('audience');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'popular';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const locale = searchParams.get('locale') || 'en';

    const supabase = await createAdminClient();

    let query = supabase
      .from('story_templates')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // Filters
    if (audience) {
      query = query.eq('audience', audience);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      query = query.overlaps('tags', tagList);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (search) {
      // Sanitize search input: remove characters that could break PostgREST filter syntax
      const sanitized = search.replace(/[%_\\(),."']/g, '');
      if (sanitized.length > 0) {
        query = query.or(
          `title->>en.ilike.%${sanitized}%,title->>de.ilike.%${sanitized}%,title->>he.ilike.%${sanitized}%,description->>en.ilike.%${sanitized}%`
        );
      }
    }

    // Sort
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'age_asc':
        query = query.order('age_min', { ascending: true });
        break;
      case 'alpha':
        query = query.order('title->en', { ascending: true });
        break;
      case 'popular':
      default:
        query = query.order('popularity_score', { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    const templates = (data || []).map(row => mapDbRowToTemplate(row, locale));

    return NextResponse.json({
      templates,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase, SCHEDULED_TWEETS_TABLE } from '@/lib/supabase';
import { withAuth } from '@/lib/auth-middleware';
import { withRateLimit } from '@/lib/rate-limit';
import { withCors } from '@/lib/cors';

async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from(SCHEDULED_TWEETS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tweet:', error);
      return NextResponse.json(
        { error: 'ツイートの削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ツイートを削除しました'
    });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    return NextResponse.json(
      { error: 'ツイートの削除に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const handler = withCors(withAuth(withRateLimit(async (req: NextRequest) => {
    return handleDELETE(req, context);
  })));
  return handler(request);
}

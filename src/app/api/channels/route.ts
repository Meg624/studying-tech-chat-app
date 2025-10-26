import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/utils/auth';
import { channelOperations } from '@/lib/db';
import { User } from '@/types/workspace';

/**
 * [GET] /api/channels: 現在認証されているユーザーが参加しているチャンネルを取得
 */
export const GET = withAuth(async (request: NextRequest, _, user: User) => {
  try {
    const channels = await channelOperations.getChannelsByUserId(user.id);

    return NextResponse.json(channels);
  } catch (error) {
    console.error('チャンネル情報の取得に失敗しました:', error);

    return NextResponse.json(
      { error: 'チャンネル情報の取得に失敗しました' },
      { status: 500 }
    );
  }
});
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { userOperations } from '@/lib/db';

export const dynamic = 'force-dynamic';


/**
 * [GET] /api/users/me: 現在認証されているユーザーの情報を取得
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user)
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      );

    // Supabase Auth から、認証されているユーザーの情報を取得
    const authUser = data.user;

    // Prisma データベースから、認証 ID に紐づくユーザー情報を取得
    const user = await userOperations.getUserByAuthId(authUser.id);
    if (!user)
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );

    return NextResponse.json(user);
  } catch (error) {
    console.error('ユーザー情報の取得に失敗しました:', error);

    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
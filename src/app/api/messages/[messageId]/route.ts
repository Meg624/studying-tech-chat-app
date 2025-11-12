// src/app/api/messages/[messageId]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

// メッセージ編集
export async function PATCH(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // リクエストボディの取得
    const { content } = await req.json();

    // バリデーション
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'メッセージは1文字以上必要です' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'メッセージは5000文字以内である必要があります' },
        { status: 400 }
      );
    }

    // メッセージの存在確認
    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが見つかりません' },
        { status: 404 }
      );
    }

    // DBのユーザーIDを取得
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（送信者本人のみ編集可能）
    if (message.senderId !== dbUser.id) {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    // メッセージを更新
    const updatedMessage = await prisma.message.update({
      where: { id: params.messageId },
      data: { content: content.trim() },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('メッセージ編集エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}

// メッセージ削除
export async function DELETE(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // メッセージの存在確認
    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが見つかりません' },
        { status: 404 }
      );
    }

    // DBのユーザーIDを取得
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 権限チェック（送信者本人のみ削除可能）
    if (message.senderId !== dbUser.id) {
      return NextResponse.json(
        { error: 'この操作を実行する権限がありません' },
        { status: 403 }
      );
    }

    // メッセージを削除
    await prisma.message.delete({
      where: { id: params.messageId },
    });

    return NextResponse.json({
      success: true,
      deletedId: params.messageId,
    });
  } catch (error) {
    console.error('メッセージ削除エラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラー' },
      { status: 500 }
    );
  }
}
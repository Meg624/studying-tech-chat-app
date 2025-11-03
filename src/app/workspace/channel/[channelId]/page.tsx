'use client';

// React
import { useState, useEffect, useMemo } from 'react';
// Next.js
import { useParams, notFound } from 'next/navigation';
// 自作コンポーネント
import ChannelHeader from '@/components/channel/channelHeader';
import MessageView from '@/components/channel/messageView';
import MessageForm from '@/components/channel/messageForm';
import Loading from '@/app/loading';
// 型
import { Input } from '@/components/ui/input'; // 検索バー用
import { ChannelType } from '@/types/workspace';
// ストア
import { useUserStore } from '@/store/useUserStore';
import { useChannelStore } from '@/store/useChannelStore';
import { useMessageStore } from '@/store/useMessageStore';
// データ
import { getDirectMessagePartner } from '@/lib/db';

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // 🔍 検索語

  const { user } = useUserStore();
  const { channels } = useChannelStore();
  const {
    messages,
    isLoading: isMessageLoading,
    fetchMessages,
    addMessage,
  } = useMessageStore();

  // ✅ チャンネルID変更時にメッセージ取得
  useEffect(() => {
    const initData = async () => {
      await fetchMessages(channelId);
      setIsInitialized(true);
    };
    initData();
  }, [channelId, fetchMessages]);

  // ✅ 検索語にマッチするメッセージを抽出（useMemoはuseEffectの外でOK）
  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (!searchTerm) return messages;
    return messages.filter((msg) =>
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messages, searchTerm]);

  // ✅ ローディング中
  if (!isInitialized || isMessageLoading) return <Loading />;

  // ✅ チャンネル情報取得
  const currentChannel = channels.find((channel) => channel.id === channelId);
  if (!currentChannel) return notFound();

  const channelDisplayName =
    currentChannel.channelType === ChannelType.CHANNEL
      ? `# ${currentChannel.name}`
      : getDirectMessagePartner(currentChannel, user?.id ?? '').name;

  const handleSendMessage = async (content: string) => {
    try {
      await addMessage(channelId, content);
    } catch (error) {
      console.error('メッセージ送信失敗:', error);
    }
  };

  // ✅ UI
  return (
    <div className="flex flex-col h-full">
      <ChannelHeader channel={currentChannel} />

      {/* 検索バー */}
      <div className="p-2 border-b bg-muted/30">
        <Input
          type="text"
          placeholder="メッセージを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 検索結果を表示 */}
      <MessageView messages={filteredMessages} myUserId={user?.id ?? ''} />

      {/* 検索結果が0件のとき */}
      {filteredMessages.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground text-sm mt-4">
          「{searchTerm}」に一致するメッセージはありません。
        </p>
      )}

      {/* 送信フォーム */}
      <MessageForm
        channelDisplayName={channelDisplayName}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
}

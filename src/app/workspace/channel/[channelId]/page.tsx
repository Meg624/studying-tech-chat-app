'use client';

// Next.js
import { useParams, notFound } from 'next/navigation';
// 自作コンポーネント
import ChannelHeader from '@/components/channel/channelHeader';
import MessageView from '@/components/channel/messageView';
import MessageForm from '@/components/channel/messageForm';
// データ
import {
  getChannel,
  getChannelMessages,
  getDirectMessagePartner,
  MY_USER_ID,
} from '@/data/workspace';
// 型
import { ChannelType } from '@/types/workspace';

export default function ChannelPage() {
  // URL のパスからチャンネル ID を取得
  const { channelId } = useParams<{ channelId: string }>();
  const channelIdNumber = parseInt(channelId, 10);
  if (isNaN(channelIdNumber)) return notFound();

  const channel = getChannel(channelIdNumber);
  if (!channel) return notFound();

  const channelDisplayName =
    channel.channelType === ChannelType.CHANNEL
      ? `#${channel.name}`
      : getDirectMessagePartner(channel, MY_USER_ID).name;

  return (
    <div className="flex flex-col h-full">
      <ChannelHeader channel={channel} />
      <MessageView
        messages={getChannelMessages(channelIdNumber)}
        myUserId={MY_USER_ID}
      />
      <MessageForm channelDisplayName={channelDisplayName} />
    </div>
  );
}
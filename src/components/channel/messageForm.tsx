'use client';

// React
import { useState } from 'react';
// アイコン
import { Send } from 'lucide-react';
// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 🟡 絵文字変換関数を追加
function convertEmoji(text: string) {
  const emojiMap: Record<string, string> = {
    ':smile:': '😄',
    ':heart:': '❤️',
    ':thumbsup:': '👍',
    ':laughing:': '😂',
    ':cry:': '😢',
    ':fire:': '🔥',
    ':star:': '⭐',
    ':ok:': '👌',
    ':wave:': '👋',
  };
  return text.replace(/:[a-z_]+:/g, (match) => emojiMap[match] || match);
}

export default function MessageForm({
  channelDisplayName,
  handleSendMessage,
}: {
  channelDisplayName: string;
  handleSendMessage: (content: string) => void;
}) {
  const [content, setContent] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    // フォームのデフォルトの送信を阻止
    e.preventDefault();
    // メッセージが空の場合は送信しない (ここでもバリデーションをかける)
    if (!content.trim()) return;
    // メッセージを送信する (この処理は、親コンポーネントから渡された関数)
      // 🟢 入力内容を送信前に絵文字変換！
    const converted = convertEmoji(content);

    handleSendMessage(converted);
    // メッセージ, input の内容をリセットする
    setContent('');
  };

  return (
    <footer onSubmit={handleSubmit} className="border-t bg-background p-4">
      <form className="flex items-center gap-4">
        <Input
          placeholder={`${channelDisplayName}にメッセージを送信`}
          className="flex-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {/* disabled 属性で、メッセージが空の場合はボタンを無効化する */}
        <Button type="submit" size="icon" disabled={!content.trim()}>
          <Send className="h-5 w-5" />
          <span className="sr-only">送信</span>
        </Button>
      </form>
    </footer>
  );
}
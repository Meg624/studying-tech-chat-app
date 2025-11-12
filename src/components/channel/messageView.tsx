'use client';

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Check, X, Smile } from 'lucide-react';
import { Message } from '@/types/workspace';

interface MessageWithReactions extends Message {
  reactions?: { emoji: string; count: number }[];
}

export default function MessageView({
  messages,
  myUserId,
  onMessageUpdate,
  onMessageDelete,
}: {
  messages: MessageWithReactions[];
  myUserId: string;
  onMessageUpdate?: (messageId: string, newContent: string) => Promise<void>;
  onMessageDelete?: (messageId: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showPickerId, setShowPickerId] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState<'top' | 'bottom'>('top');

  const [localMessages, setLocalMessages] = useState<MessageWithReactions[]>(messages);

  const emojis = ['😄', '👍', '❤️', '😂', '🔥', '👏', '😮', '😢'];

  const pickerRef = useRef<HTMLDivElement | null>(null);

  const isMyMessage = (message: Message) => message.sender.id === myUserId;

  const isEdited = (message: Message) => {
    if (!message.updatedAt) return false;
    const created = new Date(message.createdAt).getTime();
    const updated = new Date(message.updatedAt).getTime();
    return updated - created > 1000;
  };

  const startEdit = (message: Message) => {
    setEditingId(message.id);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (messageId: string) => {
    if (!editContent.trim()) {
      alert('メッセージは1文字以上必要です');
      return;
    }
    try {
      if (onMessageUpdate) await onMessageUpdate(messageId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('編集エラー:', error);
      alert('編集に失敗しました');
    }
  };

  const openDeleteDialog = (messageId: string) => {
    setDeletingId(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      if (onMessageDelete) await onMessageDelete(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  /** 🟡 リアクションの追加・削除（ローカル処理） */
  const handleReact = (messageId: string, emoji: string) => {
    setLocalMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = msg.reactions || [];
        const exists = reactions.find((r) => r.emoji === emoji);
        if (exists) {
          // 同じ絵文字があれば削除（トグル動作）
          return {
            ...msg,
            reactions: reactions.filter((r) => r.emoji !== emoji),
          };
        } else {
          // 新規追加
          return {
            ...msg,
            reactions: [...reactions, { emoji, count: 1 }],
          };
        }
      })
    );
  };

  /** 📍 吹き出し位置を自動で調整（検索バーと重ならないように） */
  useEffect(() => {
    if (showPickerId && pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      const pickerHeight = 56; // 絵文字ピッカーの高さ（約）
      
      // 上部に絵文字ピッカー全体が表示できるスペースがあるか確認
      // ヘッダー/検索バーの高さを考慮して100px以上の余裕が必要
      if (rect.top < pickerHeight + 100) {
        setPickerPosition('bottom');
      } else {
        setPickerPosition('top');
      }
    }
  }, [showPickerId]);

  return (
    <>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 py-4">
          {localMessages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2 ${
                isMyMessage(message) ? 'justify-end' : ''
              }`}
              onMouseEnter={() => setHoveredId(message.id)}
              onMouseLeave={() => {
                setHoveredId(null);
                setShowPickerId(null);
              }}
            >
              {!isMyMessage(message) && (
                <Avatar>
                  <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}

              <div className="max-w-[80%] relative group">
                {editingId === message.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') cancelEdit();
                        if (e.key === 'Enter' && e.ctrlKey) saveEdit(message.id);
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        キャンセル
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(message.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isMyMessage(message)
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      <div
                        className="text-xs text-gray-400 mt-1 text-right cursor-help"
                        title={`作成日時：${new Date(message.createdAt).toLocaleString('ja-JP')}${
                          isEdited(message)
                            ? `\n編集日時：${new Date(message.updatedAt!).toLocaleString('ja-JP')}`
                            : ''
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {isEdited(message) && (
                          <span className="ml-1 text-gray-400">(編集済み)</span>
                        )}
                      </div>
                    </div>

                    {/* 😄✏️🗑 絵文字・編集・削除ボタン */}
                    {hoveredId === message.id && (
                      <div className="absolute -top-3 right-0 flex gap-1 bg-background border rounded-md shadow-sm p-1">
                        <button
                          className="h-7 w-7 p-0 hover:bg-accent rounded flex items-center justify-center"
                          onClick={() =>
                            setShowPickerId(showPickerId === message.id ? null : message.id)
                          }
                        >
                          <Smile className="h-4 w-4" />
                        </button>
                        {isMyMessage(message) && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => startEdit(message)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(message.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* 🎨 絵文字ピッカー（位置自動調整付き） */}
                    {showPickerId === message.id && (
                      <div
                        ref={pickerRef}
                        className={`absolute ${
                          pickerPosition === 'top'
                            ? '-top-12'
                            : 'top-8'
                        } right-0 bg-popover border rounded-lg shadow-lg p-2 flex gap-1 z-[60]`}
                      >
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            className="hover:bg-accent rounded p-1.5 text-lg"
                            onClick={() => handleReact(message.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 💬 リアクション表示 */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {message.reactions.map((r) => (
                          <span
                            key={r.emoji}
                            className="px-2 py-0.5 text-sm bg-muted rounded-full cursor-pointer hover:bg-accent"
                            onClick={() => handleReact(message.id, r.emoji)}
                          >
                            {r.emoji} {r.count > 1 && r.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {isMyMessage(message) && (
                <Avatar>
                  <AvatarFallback>自</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 🗑 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>メッセージを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このメッセージを削除しますか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
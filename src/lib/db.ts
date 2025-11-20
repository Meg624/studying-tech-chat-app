import { prisma } from '@/lib/prisma';
// 型
import { User, ChannelType, Channel, Message, AiChatRecord } from '@/types/workspace';

/**
 * ユーザー関連の操作
 */
export const userOperations = {
  async createUser(authId: string, email: string, name: string): Promise<User> {
    return prisma.user.create({ data: { authId, email, name } });
  },

  async getAllUsersWithoutMe(userId: string): Promise<User[]> {
    return prisma.user.findMany({
      select: { id: true, name: true },
      where: { id: { not: userId } },
    });
  },

  async getUserByAuthId(authId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { authId } });
  },

  async updateUserName(userId: string, name: string): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data: { name } });
  },
};

/**
 * チャンネル関連の操作
 */
export const channelOperations = {
  async getChannelsByUserId(userId: string): Promise<Channel[]> {
    const channels = await prisma.channel.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
    });

    return channels.map((channel) => ({
      id: channel.id,
      name: channel.name ?? '',
      description: channel.description ?? '',
      channelType: channel.type as ChannelType,
      members: channel.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
      })),
    }));
  },

  async getChannelById(channelId: string): Promise<Channel | null> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: { include: { user: true } } },
    });
    if (!channel) return null;

    return {
      id: channel.id,
      name: channel.name ?? '',
      description: channel.description ?? '',
      channelType: channel.type as ChannelType,
      members: channel.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
      })),
    };
  },

  async createChannel(name: string, description: string, creatorId: string): Promise<Channel> {
    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        type: 'channel',
        members: { create: { user: { connect: { id: creatorId } } } },
      },
      include: { members: { include: { user: true } } },
    });

    return {
      id: channel.id,
      name: channel.name ?? '',
      description: channel.description ?? '',
      channelType: channel.type as ChannelType,
      members: channel.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
      })),
    };
  },

  async addMembersToChannel(channelId: string, userIds: string[]): Promise<Channel> {
    const channel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        members: { create: userIds.map((userId) => ({ user: { connect: { id: userId } } })) },
      },
      include: { members: { include: { user: true } } },
    });

    return {
      id: channel.id,
      name: channel.name ?? '',
      description: channel.description ?? '',
      channelType: channel.type as ChannelType,
      members: channel.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
      })),
    };
  },

  async createDirectMessage(userOneId: string, userTwoId: string): Promise<Channel> {
    const existingChannels = await prisma.channel.findMany({
      where: {
        type: 'dm',
        AND: [
          { members: { some: { userId: userOneId } } },
          { members: { some: { userId: userTwoId } } },
        ],
      },
      include: { members: { include: { user: true } } },
    });

    if (existingChannels.length > 0) {
      const channel = existingChannels[0];
      return {
        id: channel.id,
        name: channel.name ?? '',
        description: channel.description ?? '',
        channelType: channel.type as ChannelType,
        members: channel.members.map((member) => ({
          id: member.user.id,
          name: member.user.name,
        })),
      };
    }

    const channel = await prisma.channel.create({
      data: {
        type: 'dm',
        members: {
          create: [
            { user: { connect: { id: userOneId } } },
            { user: { connect: { id: userTwoId } } },
          ],
        },
      },
      include: { members: { include: { user: true } } },
    });

    return {
      id: channel.id,
      name: channel.name ?? '',
      description: channel.description ?? '',
      channelType: channel.type as ChannelType,
      members: channel.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
      })),
    };
  },
};

/**
 * DM パートナー取得
 */
export function getDirectMessagePartner(channel: Channel, myUserId: string): User {
  if (channel.channelType !== ChannelType.DM)
    throw new Error('チャンネルが DM ではありません');
  const otherUser = channel.members.find((user) => user.id !== myUserId);
  if (!otherUser) throw new Error('ユーザーが見つかりませんでした');
  return { id: otherUser.id, name: otherUser.name };
}

/**
 * メッセージ関連の操作
 */
export const messageOperations = {
  async getMessagesByChannelId(channelId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { channelId },
      include: { sender: true, channel: true },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
      sender: { id: message.sender.id, name: message.sender.name },
      channelId: message.channel.id,
    }));
  },

  async getMessagesBySenderId(senderId: string): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { senderId },
      include: { sender: true, channel: true },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
      sender: { id: message.sender.id, name: message.sender.name },
      channelId: message.channel.id,
    }));
  },

  async createMessage(channelId: string, senderId: string, content: string): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        content,
        channel: { connect: { id: channelId } },
        sender: { connect: { id: senderId } },
      },
      include: { sender: true, channel: true },
    });

    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt?.toISOString(),
      sender: { id: message.sender.id, name: message.sender.name },
      channelId: message.channel.id,
    };
  },
};

/**
 * AI チャット関連
 */
export const AI_CHAT_DAILY_USAGE_LIMIT = 3;

export const aiChatOperations = {
  async getTodayUsageCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prisma.aiChat.count({
      where: { userId, createdAt: { gte: today } },
    });
  },

  async getRemainingUsage(userId: string): Promise<number> {
    const usageCount = await aiChatOperations.getTodayUsageCount(userId);
    return Math.max(0, AI_CHAT_DAILY_USAGE_LIMIT - usageCount);
  },

  async saveConversation(userId: string, message: string, response: string): Promise<AiChatRecord> {
    const record = await prisma.aiChat.create({ data: { userId, message, response } });
    return {
      id: record.id,
      userId: record.userId,
      message: record.message,
      response: record.response,
      createdAt: record.createdAt.toISOString(), // Date → string に変換
    };
  },

  async getConversationHistory(userId: string, limit: number = 50): Promise<AiChatRecord[]> {
    const records = await prisma.aiChat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      message: record.message,
      response: record.response,
      createdAt: record.createdAt.toISOString(),
    }));
  },

  async isLimitExceeded(userId: string): Promise<boolean> {
    const usageCount = await aiChatOperations.getTodayUsageCount(userId);
    return usageCount >= AI_CHAT_DAILY_USAGE_LIMIT;
  },
};

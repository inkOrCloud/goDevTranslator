import Dexie, { Table } from 'dexie';
import { GerneralConfig } from './config';

export interface TranslationCache {
  id?: number;
  originalText: string;
  translatedText: string;
  createdAt: Date;
}

class TranslationDB extends Dexie {
  translations!: Table<TranslationCache>;

  constructor() {
    super(GerneralConfig.WebName + 'TranslationDB');
    this.version(1).stores({
      translations: '++id, originalText, createdAt',
    });
  }
}

const db = new TranslationDB();

// 注意：由于 IndexedDB 操作是异步的，我们需要相应地调整调用这些函数的代码
// 或者提供一种机制来处理异步操作

export async function GetTrans(originalText: string): Promise<string> {
  try {
    const cached = await db.translations.where('originalText').equals(originalText).first();
    return cached ? cached.translatedText : '';
  } catch (error) {
    console.error('Error retrieving translation from cache:', error);
    return '';
  }
}

export async function SetTrans(originalText: string, translatedText: string): Promise<void> {
  try {
    // 检查是否已存在相同的原始文本
    const existing = await db.translations.where('originalText').equals(originalText).first();
    
    if (existing) {
      // 如果存在，则更新现有记录
      await db.translations.update(existing.id!, { translatedText, createdAt: new Date() });
    } else {
      // 如果不存在，则添加新记录
      await db.translations.add({
        originalText,
        translatedText,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error saving translation to cache:', error);
  }
}

export async function GetSize(): Promise<number> {
  try {
    const allRecords = await db.translations.toArray();
    if (allRecords.length === 0) {
      return 0;
    }
    
    // 计算所有缓存数据的大致大小
    const serializedData = JSON.stringify(allRecords);
    return new Blob([serializedData]).size;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

export async function ClearCache(): Promise<void> {
  try {
    await db.translations.clear();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// 执行数据库初始化
export async function initializeCache(): Promise<void> {
  try {
    await db.translations.count();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// 可选：添加清理过期缓存的功能（比如删除超过一定时间的条目）
export async function CleanupOldCache(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const deletedCount = await db.translations.where('createdAt').below(cutoffDate).delete();
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old cache:', error);
    return 0;
  }
}
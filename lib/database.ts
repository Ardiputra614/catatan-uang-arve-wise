import * as SQLite from 'expo-sqlite';

export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at?: string;
}

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  margin: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('finance.db');
  }
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT NOT NULL DEFAULT '💰',
      color TEXT NOT NULL DEFAULT '#6366F1'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Seed default categories
  const existing = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );

  if (existing && existing.count === 0) {
    await database.execAsync(`
      INSERT INTO categories (name, type, icon, color) VALUES
        ('Gaji', 'income', '💼', '#10B981'),
        ('Freelance', 'income', '💻', '#3B82F6'),
        ('Investasi', 'income', '📈', '#8B5CF6'),
        ('Bisnis', 'income', '🏪', '#F59E0B'),
        ('Bonus', 'income', '🎁', '#EC4899'),
        ('Lainnya Masuk', 'income', '➕', '#06B6D4'),
        ('Makan & Minum', 'expense', '🍜', '#EF4444'),
        ('Transportasi', 'expense', '🚗', '#F97316'),
        ('Belanja', 'expense', '🛒', '#EAB308'),
        ('Tagihan', 'expense', '📄', '#6B7280'),
        ('Kesehatan', 'expense', '💊', '#14B8A6'),
        ('Hiburan', 'expense', '🎮', '#A855F7'),
        ('Pendidikan', 'expense', '📚', '#0EA5E9'),
        ('Tabungan', 'expense', '🏦', '#84CC16'),
        ('Lainnya Keluar', 'expense', '➖', '#9CA3AF');
    `);
  }
};

// TRANSACTIONS
export const addTransaction = async (tx: Transaction): Promise<number> => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)`,
    [tx.type, tx.amount, tx.category, tx.description || '', tx.date]
  );
  return result.lastInsertRowId;
};

export const updateTransaction = async (tx: Transaction): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE transactions SET type=?, amount=?, category=?, description=?, date=? WHERE id=?`,
    [tx.type, tx.amount, tx.category, tx.description || '', tx.date, tx.id!]
  );
};

export const deleteTransaction = async (id: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM transactions WHERE id=?', [id]);
};

export const getTransactions = async (
  filters?: { type?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }
): Promise<Transaction[]> => {
  const database = await getDatabase();
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters?.type && filters.type !== 'all') {
    query += ' AND type=?';
    params.push(filters.type);
  }
  if (filters?.startDate) {
    query += ' AND date >= ?';
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    query += ' AND date <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  if (filters?.limit) {
    query += ` LIMIT ${filters.limit}`;
    if (filters.offset) query += ` OFFSET ${filters.offset}`;
  }

  return await database.getAllAsync<Transaction>(query, params);
};

export const getSummary = async (startDate?: string, endDate?: string): Promise<Summary> => {
  const database = await getDatabase();
  let query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as totalExpense
    FROM transactions WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND date <= ?'; params.push(endDate); }

  const result = await database.getFirstAsync<{ totalIncome: number; totalExpense: number }>(query, params);
  const income = result?.totalIncome || 0;
  const expense = result?.totalExpense || 0;
  const balance = income - expense;
  const margin = income > 0 ? ((income - expense) / income) * 100 : 0;

  return { totalIncome: income, totalExpense: expense, balance, margin };
};

export const getMonthlySummary = async (year: number): Promise<any[]> => {
  const database = await getDatabase();
  return await database.getAllAsync<any>(`
    SELECT 
      strftime('%m', date) as month,
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions
    WHERE strftime('%Y', date) = ?
    GROUP BY month
    ORDER BY month ASC
  `, [year.toString()]);
};

export const getCategoryBreakdown = async (
  type: 'income' | 'expense', startDate?: string, endDate?: string
): Promise<any[]> => {
  const database = await getDatabase();
  let query = `
    SELECT category, SUM(amount) as total
    FROM transactions
    WHERE type=?
  `;
  const params: any[] = [type];

  if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND date <= ?'; params.push(endDate); }

  query += ' GROUP BY category ORDER BY total DESC';
  return await database.getAllAsync<any>(query, params);
};

// CATEGORIES
export const getCategories = async (type?: 'income' | 'expense'): Promise<Category[]> => {
  const database = await getDatabase();
  if (type) {
    return await database.getAllAsync<Category>('SELECT * FROM categories WHERE type=? ORDER BY name', [type]);
  }
  return await database.getAllAsync<Category>('SELECT * FROM categories ORDER BY type, name');
};

export const addCategory = async (cat: Category): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
    [cat.name, cat.type, cat.icon, cat.color]
  );
};

export const deleteCategory = async (id: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM categories WHERE id=?', [id]);
};

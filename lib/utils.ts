export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getStartOfMonth = (date?: Date): string => {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export const getEndOfMonth = (date?: Date): string => {
  const d = date || new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return lastDay.toISOString().split('T')[0];
};

export const getStartOfYear = (year?: number): string => {
  const y = year || new Date().getFullYear();
  return `${y}-01-01`;
};

export const getEndOfYear = (year?: number): string => {
  const y = year || new Date().getFullYear();
  return `${y}-12-31`;
};

export const getMonthName = (monthStr: string): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  return months[parseInt(monthStr) - 1] || monthStr;
};

export const COLORS = {
  income: '#10B981',
  expense: '#EF4444',
  balance: '#6366F1',
  primary: '#6366F1',
  secondary: '#8B5CF6',
  bg: '#0F172A',
  bgCard: '#1E293B',
  bgCardAlt: '#0F172A',
  border: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  warning: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
};

export const CHART_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#3B82F6', '#EF4444', '#14B8A6',
  '#F97316', '#A855F7', '#0EA5E9', '#84CC16',
];

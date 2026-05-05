import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getSummary, getMonthlySummary, getCategoryBreakdown, getTransactions
} from '@/lib/database';
import {
  formatCurrency, COLORS, getStartOfMonth, getEndOfMonth,
  getStartOfYear, getEndOfYear, getMonthName, CHART_COLORS,
} from '@/lib/utils';

const { width } = Dimensions.get('window');
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

type Period = 'month' | 'year' | 'all';

export default function ReportsScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, margin: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<any[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const year = new Date().getFullYear();

  const getDateRange = () => {
    if (period === 'month') return { start: getStartOfMonth(), end: getEndOfMonth() };
    if (period === 'year') return { start: getStartOfYear(), end: getEndOfYear() };
    return { start: undefined, end: undefined };
  };

  const loadData = async () => {
    const { start, end } = getDateRange();
    const [sum, monthly, income, expense] = await Promise.all([
      getSummary(start, end),
      getMonthlySummary(year),
      getCategoryBreakdown('income', start, end),
      getCategoryBreakdown('expense', start, end),
    ]);
    setSummary(sum);
    setMonthlyData(monthly);
    setIncomeBreakdown(income);
    setExpenseBreakdown(expense);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [period]));

  const maxBar = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1);

  const renderDonut = (data: any[], total: number, type: string) => {
    if (data.length === 0) return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>Tidak ada data</Text>
      </View>
    );

    return (
      <View>
        {data.slice(0, 6).map((item, i) => {
          const pct = total > 0 ? (item.total / total) * 100 : 0;
          return (
            <View key={item.category} style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
              <Text style={styles.categoryName} numberOfLines={1}>{item.category}</Text>
              <View style={styles.categoryBarBg}>
                <View style={[
                  styles.categoryBarFill,
                  {
                    width: `${pct}%` as any,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length]
                  }
                ]} />
              </View>
              <Text style={styles.categoryPct}>{pct.toFixed(1)}%</Text>
              <Text style={styles.categoryAmt}>{formatCurrency(item.total)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Laporan</Text>
      </View>

      {/* Period Filter */}
      <View style={styles.periodRow}>
        {(['month', 'year', 'all'] as Period[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'month' ? 'Bulan Ini' : p === 'year' ? 'Tahun Ini' : 'Semua'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.income }]}>
          <Ionicons name="arrow-down-circle" size={24} color={COLORS.income} />
          <Text style={styles.summaryLabel}>Total Pemasukan</Text>
          <Text style={[styles.summaryValue, { color: COLORS.income }]}>
            {formatCurrency(summary.totalIncome)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.expense }]}>
          <Ionicons name="arrow-up-circle" size={24} color={COLORS.expense} />
          <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
          <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
            {formatCurrency(summary.totalExpense)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.primary }]}>
          <Ionicons name="wallet" size={24} color={COLORS.primary} />
          <Text style={styles.summaryLabel}>Saldo / Balance</Text>
          <Text style={[styles.summaryValue, { color: summary.balance >= 0 ? COLORS.income : COLORS.expense }]}>
            {formatCurrency(summary.balance)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.warning }]}>
          <Ionicons name="trending-up" size={24} color={COLORS.warning} />
          <Text style={styles.summaryLabel}>Margin Keuntungan</Text>
          <Text style={[styles.summaryValue, { color: summary.margin >= 0 ? COLORS.income : COLORS.expense }]}>
            {summary.margin.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Overflow indicator */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overflow / Cash Flow</Text>
        <View style={styles.overflowRow}>
          <View style={styles.overflowItem}>
            <Text style={styles.overflowLabel}>Pemasukan</Text>
            <Text style={[styles.overflowValue, { color: COLORS.income }]}>{formatCurrency(summary.totalIncome)}</Text>
          </View>
          <Text style={styles.overflowMinus}>−</Text>
          <View style={styles.overflowItem}>
            <Text style={styles.overflowLabel}>Pengeluaran</Text>
            <Text style={[styles.overflowValue, { color: COLORS.expense }]}>{formatCurrency(summary.totalExpense)}</Text>
          </View>
          <Text style={styles.overflowEquals}>=</Text>
          <View style={styles.overflowItem}>
            <Text style={styles.overflowLabel}>Overflow</Text>
            <Text style={[styles.overflowValue, { color: summary.balance >= 0 ? COLORS.income : COLORS.expense, fontWeight: '800' }]}>
              {formatCurrency(summary.balance)}
            </Text>
          </View>
        </View>
        {/* Progress bar */}
        {summary.totalIncome > 0 && (
          <View style={styles.progressWrapper}>
            <View style={styles.progressBg}>
              <View style={[
                styles.progressFill,
                {
                  width: `${Math.min((summary.totalExpense / summary.totalIncome) * 100, 100)}%` as any,
                  backgroundColor: summary.totalExpense > summary.totalIncome ? COLORS.expense : COLORS.income,
                }
              ]} />
            </View>
            <Text style={styles.progressText}>
              {((summary.totalExpense / summary.totalIncome) * 100).toFixed(1)}% dari pemasukan terpakai
            </Text>
          </View>
        )}
      </View>

      {/* Monthly Bar Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Grafik Bulanan {year}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartScroll}>
            <View style={styles.chartArea}>
              {MONTH_NAMES.map((label, i) => {
                const mData = monthlyData.find(m => parseInt(m.month) === i + 1);
                const income = mData?.income || 0;
                const expense = mData?.expense || 0;
                const incomeH = Math.max((income / maxBar) * 100, income > 0 ? 4 : 0);
                const expenseH = Math.max((expense / maxBar) * 100, expense > 0 ? 4 : 0);
                return (
                  <View key={label} style={styles.barGroupLarge}>
                    <View style={styles.barsWrapperLarge}>
                      <View style={[styles.barLarge, { height: incomeH, backgroundColor: COLORS.income }]} />
                      <View style={[styles.barLarge, { height: expenseH, backgroundColor: COLORS.expense }]} />
                    </View>
                    <Text style={styles.barLabelLarge}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.income }]} />
            <Text style={styles.legendText}>Pemasukan</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.expense }]} />
            <Text style={styles.legendText}>Pengeluaran</Text>
          </View>
        </View>
      </View>

      {/* Income Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rincian Pemasukan</Text>
        {renderDonut(incomeBreakdown, summary.totalIncome, 'income')}
      </View>

      {/* Expense Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rincian Pengeluaran</Text>
        {renderDonut(expenseBreakdown, summary.totalExpense, 'expense')}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  periodRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8,
  },
  periodBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: COLORS.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  periodTextActive: { color: '#fff' },
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 20, gap: 10, marginBottom: 16,
  },
  summaryCard: {
    width: (width - 50) / 2, backgroundColor: COLORS.bgCard, borderRadius: 16,
    padding: 16, borderTopWidth: 3, borderWidth: 1, borderColor: COLORS.border, gap: 6,
  },
  summaryLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500' },
  summaryValue: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  card: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  overflowRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  overflowItem: { alignItems: 'center', flex: 1 },
  overflowLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 },
  overflowValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  overflowMinus: { color: COLORS.textMuted, fontSize: 20, fontWeight: '300' },
  overflowEquals: { color: COLORS.textMuted, fontSize: 20, fontWeight: '300' },
  progressWrapper: { marginTop: 16 },
  progressBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressText: { color: COLORS.textMuted, fontSize: 11, marginTop: 6 },
  chartScroll: { paddingRight: 10 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  barGroupLarge: { alignItems: 'center', width: 36 },
  barsWrapperLarge: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 100 },
  barLarge: { width: 12, borderRadius: 4 },
  barLabelLarge: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 12 },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { color: COLORS.text, fontSize: 12, width: 90 },
  categoryBarBg: {
    flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden',
  },
  categoryBarFill: { height: 6, borderRadius: 3 },
  categoryPct: { color: COLORS.textMuted, fontSize: 11, width: 36, textAlign: 'right' },
  categoryAmt: { color: COLORS.text, fontSize: 11, fontWeight: '600', width: 80, textAlign: 'right' },
  emptyChart: { alignItems: 'center', paddingVertical: 24 },
  emptyChartText: { color: COLORS.textMuted, fontSize: 14 },
});

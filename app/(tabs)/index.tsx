import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSummary, getTransactions, getMonthlySummary, Transaction } from '@/lib/database';
import {
  formatCurrency, COLORS, getStartOfMonth, getEndOfMonth,
  formatDateShort, getMonthName,
} from '@/lib/utils';

const { width } = Dimensions.get('window');

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function DashboardScreen() {
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, margin: 0 });
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const loadData = async () => {
    const start = getStartOfMonth();
    const end = getEndOfMonth();
    const [sum, txs, monthly] = await Promise.all([
      getSummary(start, end),
      getTransactions({ limit: 10 }),
      getMonthlySummary(currentYear),
    ]);
    setSummary(sum);
    setRecentTx(txs);
    setMonthlyData(monthly);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const maxBarValue = Math.max(
    ...monthlyData.map(m => Math.max(m.income, m.expense)), 1
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Catatan Keuangan</Text>
          <Text style={styles.headerTitle}>{currentMonth}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/transaction/add')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Bulan Ini</Text>
        <Text style={[styles.balanceAmount, { color: summary.balance >= 0 ? COLORS.income : COLORS.expense }]}>
          {formatCurrency(summary.balance)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <View style={[styles.dot, { backgroundColor: COLORS.income }]} />
            <View>
              <Text style={styles.balanceItemLabel}>Pemasukan</Text>
              <Text style={[styles.balanceItemAmount, { color: COLORS.income }]}>
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceItem}>
            <View style={[styles.dot, { backgroundColor: COLORS.expense }]} />
            <View>
              <Text style={styles.balanceItemLabel}>Pengeluaran</Text>
              <Text style={[styles.balanceItemAmount, { color: COLORS.expense }]}>
                {formatCurrency(summary.totalExpense)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
          <Ionicons name="trending-up" size={20} color={COLORS.primary} />
          <Text style={styles.statLabel}>Margin</Text>
          <Text style={[styles.statValue, { color: summary.margin >= 0 ? COLORS.income : COLORS.expense }]}>
            {summary.margin.toFixed(1)}%
          </Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
          <Ionicons name="analytics" size={20} color={COLORS.warning} />
          <Text style={styles.statLabel}>Overflow</Text>
          <Text style={[styles.statValue, { color: summary.balance >= 0 ? COLORS.income : COLORS.expense }]}>
            {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)}
          </Text>
        </View>
      </View>

      {/* Monthly Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Grafik Tahun {currentYear}</Text>
        <View style={styles.chartContainer}>
          {MONTH_LABELS.map((label, i) => {
            const mData = monthlyData.find(m => parseInt(m.month) === i + 1);
            const income = mData?.income || 0;
            const expense = mData?.expense || 0;
            const incomeH = Math.max((income / maxBarValue) * 80, income > 0 ? 4 : 0);
            const expenseH = Math.max((expense / maxBarValue) * 80, expense > 0 ? 4 : 0);
            return (
              <View key={label} style={styles.barGroup}>
                <View style={styles.barsWrapper}>
                  <View style={[styles.bar, { height: incomeH, backgroundColor: COLORS.income }]} />
                  <View style={[styles.bar, { height: expenseH, backgroundColor: COLORS.expense }]} />
                </View>
                <Text style={styles.barLabel}>{label}</Text>
              </View>
            );
          })}
        </View>
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

      {/* Recent Transactions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Transaksi Terbaru</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        {recentTx.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/transaction/add')}>
              <Text style={styles.emptyBtnText}>Tambah Transaksi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentTx.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txItem}
              onPress={() => router.push({ pathname: '/transaction/detail', params: { id: tx.id } })}
            >
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? '#10B98120' : '#EF444420' }]}>
                <Ionicons
                  name={tx.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={22}
                  color={tx.type === 'income' ? COLORS.income : COLORS.expense}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txCategory}>{tx.category}</Text>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description || '-'}</Text>
                <Text style={styles.txDate}>{formatDateShort(tx.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.expense }]}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  headerSub: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  balanceCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: COLORS.border,
  },
  balanceLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 4 },
  balanceAmount: { fontSize: 34, fontWeight: '800', letterSpacing: -1, marginBottom: 20 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  balanceItemLabel: { color: COLORS.textMuted, fontSize: 12 },
  balanceItemAmount: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  divider: { width: 1, height: 36, backgroundColor: COLORS.border, marginHorizontal: 12 },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border, gap: 6,
  },
  statLabel: { color: COLORS.textMuted, fontSize: 12 },
  statValue: { fontSize: 18, fontWeight: '700' },
  card: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 16 },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 2 },
  barGroup: { flex: 1, alignItems: 'center' },
  barsWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 },
  bar: { width: 6, borderRadius: 3, minHeight: 0 },
  barLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 4 },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 12 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  txIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txCategory: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  txDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  txDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  emptyBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24,
    paddingVertical: 10, borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
});

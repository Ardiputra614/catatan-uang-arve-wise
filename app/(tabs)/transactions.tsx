import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl, TextInput, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions, deleteTransaction, Transaction } from '@/lib/database';
import { formatCurrency, formatDateShort, COLORS } from '@/lib/utils';
import Toast from 'react-native-toast-message';

const FILTER_OPTIONS = [
  { label: 'Semua', value: 'all' },
  { label: 'Pemasukan', value: 'income' },
  { label: 'Pengeluaran', value: 'expense' },
];

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const txs = await getTransactions({ type: filter === 'all' ? undefined : filter });
    setTransactions(txs);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [filter]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Hapus Transaksi',
      `Hapus transaksi "${tx.category}" sebesar ${formatCurrency(tx.amount)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            await deleteTransaction(tx.id!);
            Toast.show({ type: 'success', text1: 'Transaksi dihapus' });
            loadData();
          },
        },
      ]
    );
  };

  const filtered = transactions.filter(tx => {
    if (!search) return true;
    return (
      tx.category.toLowerCase().includes(search.toLowerCase()) ||
      (tx.description || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const groupByDate = () => {
    const groups: { date: string; transactions: Transaction[] }[] = [];
    filtered.forEach(tx => {
      const existing = groups.find(g => g.date === tx.date);
      if (existing) {
        existing.transactions.push(tx);
      } else {
        groups.push({ date: tx.date, transactions: [tx] });
      }
    });
    return groups;
  };

  const groups = groupByDate();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/transaction/add')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari transaksi..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.filterBtn, filter === opt.value && styles.filterBtnActive]}
            onPress={() => setFilter(opt.value as any)}
          >
            <Text style={[styles.filterText, filter === opt.value && styles.filterTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
            <Text style={styles.emptyText}>Tap tombol + untuk menambah transaksi</Text>
          </View>
        ) : (
          groups.map(group => (
            <View key={group.date}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{formatDateShort(group.date)}</Text>
                <Text style={styles.dateSummary}>
                  {group.transactions.length} transaksi
                </Text>
              </View>
              {group.transactions.map(tx => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.txItem}
                  onPress={() => router.push({ pathname: '/transaction/detail', params: { id: tx.id } })}
                  onLongPress={() => handleDelete(tx)}
                >
                  <View style={[styles.txIcon, {
                    backgroundColor: tx.type === 'income' ? '#10B98120' : '#EF444420'
                  }]}>
                    <Ionicons
                      name={tx.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={22}
                      color={tx.type === 'income' ? COLORS.income : COLORS.expense}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory}>{tx.category}</Text>
                    {tx.description ? (
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, {
                      color: tx.type === 'income' ? COLORS.income : COLORS.expense
                    }]}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                    <View style={[styles.txBadge, {
                      backgroundColor: tx.type === 'income' ? '#10B98120' : '#EF444420'
                    }]}>
                      <Text style={[styles.txBadgeText, {
                        color: tx.type === 'income' ? COLORS.income : COLORS.expense
                      }]}>
                        {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  headerTitle: { color: COLORS.text, fontSize: 28, fontWeight: '800' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  filterRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, gap: 8 },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    backgroundColor: COLORS.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { flex: 1 },
  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: '#0F172A80',
  },
  dateText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  dateSummary: { color: COLORS.textMuted, fontSize: 11 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border + '40',
    backgroundColor: COLORS.bgCard,
  },
  txIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txCategory: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  txDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  txBadgeText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});

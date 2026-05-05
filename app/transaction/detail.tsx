import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions, deleteTransaction, Transaction } from '@/lib/database';
import { formatCurrency, formatDate, COLORS } from '@/lib/utils';
import Toast from 'react-native-toast-message';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tx, setTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (id) loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    const txs = await getTransactions();
    const found = txs.find(t => t.id === parseInt(id));
    setTx(found || null);
  };

  const handleDelete = () => {
    if (!tx) return;
    Alert.alert('Hapus Transaksi', 'Yakin ingin menghapus transaksi ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await deleteTransaction(tx.id!);
          Toast.show({ type: 'success', text1: 'Transaksi dihapus' });
          router.back();
        }
      }
    ]);
  };

  if (!tx) return (
    <View style={styles.loading}>
      <Text style={{ color: COLORS.textMuted }}>Memuat...</Text>
    </View>
  );

  const isIncome = tx.type === 'income';
  const color = isIncome ? COLORS.income : COLORS.expense;

  return (
    <View style={styles.container}>
      <View style={styles.handleBar} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Transaksi</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color={COLORS.expense} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Amount hero */}
        <View style={[styles.heroCard, { borderTopColor: color }]}>
          <View style={[styles.heroIcon, { backgroundColor: color + '20' }]}>
            <Ionicons
              name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={40}
              color={color}
            />
          </View>
          <Text style={styles.heroLabel}>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</Text>
          <Text style={[styles.heroAmount, { color }]}>
            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <DetailRow label="Kategori" value={tx.category} />
          <DetailRow label="Tanggal" value={formatDate(tx.date)} />
          {tx.description ? <DetailRow label="Keterangan" value={tx.description} /> : null}
          {tx.created_at ? (
            <DetailRow label="Dicatat pada" value={new Date(tx.created_at).toLocaleString('id-ID')} />
          ) : null}
        </View>

        {/* Edit button */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({ pathname: '/transaction/edit', params: { id: tx.id } })}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
          <Text style={styles.editBtnText}>Edit Transaksi</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgCard },
  container: { flex: 1, backgroundColor: COLORS.bgCard },
  handleBar: {
    width: 40, height: 4, backgroundColor: COLORS.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  heroCard: {
    margin: 20, backgroundColor: COLORS.bg, borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 12, borderTopWidth: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  heroIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  heroLabel: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  heroAmount: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  detailCard: {
    marginHorizontal: 20, backgroundColor: COLORS.bg, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.textMuted, fontSize: 13 },
  rowValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 20, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14,
  },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

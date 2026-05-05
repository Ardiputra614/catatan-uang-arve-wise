import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTransactions, updateTransaction, getCategories, Category, Transaction } from '@/lib/database';
import { COLORS } from '@/lib/utils';
import Toast from 'react-native-toast-message';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [originalTx, setOriginalTx] = useState<Transaction | null>(null);

  useEffect(() => { if (id) loadTransaction(); }, [id]);
  useEffect(() => { loadCategories(); }, [type]);

  const loadTransaction = async () => {
    const txs = await getTransactions();
    const found = txs.find(t => t.id === parseInt(id));
    if (found) {
      setOriginalTx(found);
      setType(found.type);
      setAmount(found.amount.toString());
      setCategory(found.category);
      setDescription(found.description || '');
      setDate(found.date);
    }
  };

  const loadCategories = async () => {
    const cats = await getCategories(type);
    setCategories(cats);
  };

  const handleAmountChange = (text: string) => {
    setAmount(text.replace(/[^0-9]/g, ''));
  };

  const formatAmountDisplay = (val: string) => {
    if (!val) return '';
    return parseInt(val).toLocaleString('id-ID');
  };

  const handleSave = async () => {
    if (!amount || parseInt(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Jumlah harus diisi' });
      return;
    }
    if (!category) {
      Toast.show({ type: 'error', text1: 'Pilih kategori' });
      return;
    }
    setLoading(true);
    try {
      await updateTransaction({
        id: parseInt(id), type, amount: parseInt(amount), category, description, date,
      });
      Toast.show({ type: 'success', text1: 'Transaksi diperbarui!' });
      router.back();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Gagal memperbarui' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.handleBar} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Transaksi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && { backgroundColor: COLORS.expense }]}
            onPress={() => setType('expense')}
          >
            <Ionicons name="arrow-up-circle" size={18} color={type === 'expense' ? '#fff' : COLORS.textMuted} />
            <Text style={[styles.typeBtnText, type === 'expense' && { color: '#fff' }]}>Pengeluaran</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && { backgroundColor: COLORS.income }]}
            onPress={() => setType('income')}
          >
            <Ionicons name="arrow-down-circle" size={18} color={type === 'income' ? '#fff' : COLORS.textMuted} />
            <Text style={[styles.typeBtnText, type === 'income' && { color: '#fff' }]}>Pemasukan</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <Text style={styles.currencySign}>Rp</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={COLORS.border}
            value={formatAmountDisplay(amount)}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, category === cat.name && styles.catChipActive]}
                onPress={() => setCategory(cat.name)}
              >
                <Text>{cat.icon}</Text>
                <Text style={[styles.catChipText, category === cat.name && { color: '#fff' }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Tanggal</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Keterangan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tambahkan catatan..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: type === 'income' ? COLORS.income : COLORS.expense }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.saveBtnText}>{loading ? 'Menyimpan...' : 'Update Transaksi'}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  typeToggle: {
    flexDirection: 'row', margin: 20, gap: 10,
    backgroundColor: COLORS.bg, borderRadius: 14, padding: 4,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  typeBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  amountCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: COLORS.bg, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  currencySign: { color: COLORS.textMuted, fontSize: 24, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, color: COLORS.text, fontSize: 36, fontWeight: '800' },
  form: { paddingHorizontal: 20 },
  label: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.bg, borderRadius: 12, padding: 14,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 15,
  },
  textArea: { height: 80 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 20, borderRadius: 16, paddingVertical: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, addCategory, deleteCategory, Category } from '@/lib/database';
import { COLORS } from '@/lib/utils';
import Toast from 'react-native-toast-message';

const EMOJI_LIST = ['💰','💼','💻','📈','🏪','🎁','➕','🍜','🚗','🛒','📄','💊','🎮','📚','🏦','➖','🏠','✈️','🎯','⚡','🌟','🎵','📱','🍕','☕','🎂','👗','🏋️','🚌','🚕'];
const COLOR_LIST = ['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EC4899','#EF4444','#06B6D4','#F97316','#A855F7','#0EA5E9','#84CC16','#14B8A6','#6366F1'];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'expense' as 'income' | 'expense', icon: '💰', color: '#6366F1' });
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');

  const loadData = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleAdd = async () => {
    if (!form.name.trim()) {
      Toast.show({ type: 'error', text1: 'Nama kategori tidak boleh kosong' });
      return;
    }
    await addCategory({ ...form, name: form.name.trim() });
    Toast.show({ type: 'success', text1: 'Kategori ditambahkan' });
    setShowModal(false);
    setForm({ name: '', type: 'expense', icon: '💰', color: '#6366F1' });
    loadData();
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Hapus Kategori', `Hapus kategori "${cat.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await deleteCategory(cat.id!);
          Toast.show({ type: 'success', text1: 'Kategori dihapus' });
          loadData();
        }
      }
    ]);
  };

  const filtered = categories.filter(c => c.type === activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kategori</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expense' && styles.tabActive]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>Pengeluaran</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && { ...styles.tabActive, backgroundColor: COLORS.income }]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>Pemasukan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filtered.map(cat => (
            <View key={cat.id} style={styles.catCard}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
              <TouchableOpacity
                style={styles.catDelete}
                onPress={() => handleDelete(cat)}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.expense} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.catCardAdd} onPress={() => {
            setForm(f => ({ ...f, type: activeTab }));
            setShowModal(true);
          }}>
            <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
            <Text style={styles.catAddText}>Tambah</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kategori Baru</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Type */}
            <Text style={styles.fieldLabel}>Tipe</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, form.type === 'income' && { backgroundColor: COLORS.income, borderColor: COLORS.income }]}
                onPress={() => setForm(f => ({ ...f, type: 'income' }))}
              >
                <Text style={[styles.typeBtnText, form.type === 'income' && { color: '#fff' }]}>Pemasukan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, form.type === 'expense' && { backgroundColor: COLORS.expense, borderColor: COLORS.expense }]}
                onPress={() => setForm(f => ({ ...f, type: 'expense' }))}
              >
                <Text style={[styles.typeBtnText, form.type === 'expense' && { color: '#fff' }]}>Pengeluaran</Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Nama Kategori</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Gaji, Makan, dll"
              placeholderTextColor={COLORS.textMuted}
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />

            {/* Icon */}
            <Text style={styles.fieldLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
              {EMOJI_LIST.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, form.icon === e && styles.emojiBtnActive]}
                  onPress={() => setForm(f => ({ ...f, icon: e }))}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color */}
            <Text style={styles.fieldLabel}>Warna</Text>
            <View style={styles.colorRow}>
              {COLOR_LIST.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorBtn, { backgroundColor: c }, form.color === c && styles.colorBtnActive]}
                  onPress={() => setForm(f => ({ ...f, color: c }))}
                >
                  {form.color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Simpan Kategori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: COLORS.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.expense, borderColor: COLORS.expense },
  tabText: { color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, paddingBottom: 24,
  },
  catCard: {
    width: '30%', backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border,
    position: 'relative',
  },
  catIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  catEmoji: { fontSize: 24 },
  catName: { color: COLORS.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  catDelete: { position: 'absolute', top: 6, right: 6 },
  catCardAdd: {
    width: '30%', backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border,
    borderStyle: 'dashed', justifyContent: 'center',
  },
  catAddText: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCardAlt,
  },
  typeBtnText: { color: COLORS.textMuted, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.bgCardAlt, borderRadius: 12, padding: 14,
    color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, fontSize: 15,
  },
  emojiScroll: { maxHeight: 56 },
  emojiBtn: { padding: 8, borderRadius: 10, marginRight: 4 },
  emojiBtnActive: { backgroundColor: COLORS.primary + '30', borderWidth: 2, borderColor: COLORS.primary },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorBtn: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
  },
  colorBtnActive: { borderWidth: 3, borderColor: '#fff' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

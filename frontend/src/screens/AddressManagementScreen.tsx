import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getApiErrorMessage, shopApi, UserAddress } from '../services/api';

const emptyForm = {
  receiver_name: '',
  receiver_phone: '',
  receiver_address: '',
  is_default: false,
};

const AddressManagementScreen = ({ navigation }: any) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadAddresses = async () => {
    try {
      const response = await shopApi.getAddresses();
      setAddresses(response);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取收货地址失败'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAddresses();
    }, []),
  );

  const openCreate = () => {
    setEditingAddress(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (address: UserAddress) => {
    setEditingAddress(address);
    setForm({
      receiver_name: address.receiver_name,
      receiver_phone: address.receiver_phone,
      receiver_address: address.receiver_address,
      is_default: address.is_default,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!form.receiver_name.trim() || !form.receiver_phone.trim() || !form.receiver_address.trim()) {
      Alert.alert('提示', '请完整填写收货信息');
      return;
    }

    try {
      setSaving(true);
      if (editingAddress) {
        await shopApi.updateAddress(editingAddress.id, {
          receiver_name: form.receiver_name.trim(),
          receiver_phone: form.receiver_phone.trim(),
          receiver_address: form.receiver_address.trim(),
          is_default: form.is_default,
        });
      } else {
        await shopApi.createAddress({
          receiver_name: form.receiver_name.trim(),
          receiver_phone: form.receiver_phone.trim(),
          receiver_address: form.receiver_address.trim(),
          is_default: form.is_default,
        });
      }
      setModalVisible(false);
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '保存地址失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (address: UserAddress) => {
    Alert.alert('删除地址', '确定删除这个收货地址吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await shopApi.deleteAddress(address.id);
            await loadAddresses();
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '删除地址失败'));
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (address: UserAddress) => {
    try {
      await shopApi.updateAddress(address.id, { is_default: true });
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '设置默认地址失败'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>收货地址</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Text style={styles.addButtonText}>新增</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {addresses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>还没有收货地址</Text>
              <Text style={styles.emptyText}>新增一个默认地址后，下单会更顺畅。</Text>
            </View>
          ) : (
            addresses.map((address) => (
              <View style={styles.addressCard} key={address.id}>
                <View style={styles.addressTopRow}>
                  <Text style={styles.addressName}>
                    {address.receiver_name} · {address.receiver_phone}
                  </Text>
                  {address.is_default ? (
                    <View style={styles.defaultChip}>
                      <Text style={styles.defaultChipText}>默认</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.addressText}>{address.receiver_address}</Text>
                <View style={styles.actionRow}>
                  {!address.is_default ? (
                    <TouchableOpacity style={styles.ghostButton} onPress={() => handleSetDefault(address)}>
                      <Text style={styles.ghostButtonText}>设为默认</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={styles.ghostButton} onPress={() => openEdit(address)}>
                    <Text style={styles.ghostButtonText}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerButton} onPress={() => handleDelete(address)}>
                    <Text style={styles.dangerButtonText}>删除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingAddress ? '编辑地址' : '新增地址'}</Text>
            <TextInput
              style={styles.input}
              value={form.receiver_name}
              onChangeText={(receiver_name) => setForm((prev) => ({ ...prev, receiver_name }))}
              placeholder="收货人"
            />
            <TextInput
              style={styles.input}
              value={form.receiver_phone}
              onChangeText={(receiver_phone) => setForm((prev) => ({ ...prev, receiver_phone }))}
              placeholder="手机号"
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, styles.addressInput]}
              value={form.receiver_address}
              onChangeText={(receiver_address) => setForm((prev) => ({ ...prev, receiver_address }))}
              placeholder="详细地址"
              multiline
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>设为默认地址</Text>
              <Switch
                value={form.is_default}
                onValueChange={(is_default) => setForm((prev) => ({ ...prev, is_default }))}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalSecondaryText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleSubmit} disabled={saving}>
                <Text style={styles.modalPrimaryText}>{saving ? '保存中...' : '保存'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f4' },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { padding: 8 },
  backButtonText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  addButton: { paddingVertical: 8, paddingHorizontal: 10 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#243029' },
  emptyText: { marginTop: 8, color: '#718078', textAlign: 'center' },
  addressCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14 },
  addressTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressName: { fontSize: 16, fontWeight: '700', color: '#243029' },
  defaultChip: { backgroundColor: '#edf6ef', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  defaultChipText: { color: '#2f7d4f', fontSize: 12, fontWeight: '700' },
  addressText: { marginTop: 12, color: '#516057', lineHeight: 22 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  ghostButton: {
    backgroundColor: '#edf2ef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ghostButtonText: { color: '#355544', fontWeight: '600' },
  dangerButton: {
    backgroundColor: '#fff2f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dangerButtonText: { color: '#d45645', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 22, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#243029', marginBottom: 16 },
  input: {
    backgroundColor: '#f3f6f4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  addressInput: { minHeight: 96, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  switchLabel: { color: '#45524b', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 18 },
  modalSecondaryButton: { paddingVertical: 12, paddingHorizontal: 18 },
  modalSecondaryText: { color: '#5f6b64', fontWeight: '600' },
  modalPrimaryButton: { backgroundColor: '#2f7d4f', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
  modalPrimaryText: { color: '#fff', fontWeight: '700' },
});

export default AddressManagementScreen;

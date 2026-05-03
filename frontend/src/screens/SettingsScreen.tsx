import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageUploaderField from '../components/ImageUploaderField';
import { getApiErrorMessage, resolveMediaUrl, userApi } from '../services/api';

type ModalMode = 'profile' | 'password' | 'email' | null;

const SettingsScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [profileForm, setProfileForm] = useState({ nickname: '', avatar: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [email, setEmail] = useState('');

  const modalTitle = useMemo(() => {
    if (modalMode === 'profile') return '编辑个人信息';
    if (modalMode === 'password') return '修改密码';
    if (modalMode === 'email') return '绑定邮箱';
    return '';
  }, [modalMode]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await userApi.getProfile();
      setUser(response.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    } catch (error: any) {
      const localUser = await AsyncStorage.getItem('user');
      if (localUser) {
        setUser(JSON.parse(localUser));
      }
      Alert.alert('错误', getApiErrorMessage(error, '加载用户信息失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const openProfile = () => {
    setProfileForm({
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
    });
    setModalMode('profile');
  };

  const openPassword = () => {
    setPasswordForm({ oldPassword: '', newPassword: '' });
    setModalMode('password');
  };

  const openEmail = () => {
    setEmail(user?.email || '');
    setModalMode('email');
  };

  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const response = await userApi.updateUser(profileForm);
      setUser(response.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      setModalMode(null);
      Alert.alert('成功', '个人信息已更新');
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '更新个人信息失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      Alert.alert('提示', '请输入旧密码和新密码');
      return;
    }

    try {
      setLoading(true);
      await userApi.changePassword(passwordForm);
      setModalMode(null);
      Alert.alert('成功', '密码修改成功');
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '修改密码失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleBindEmail = async () => {
    if (!email.trim()) {
      Alert.alert('提示', '请输入邮箱地址');
      return;
    }

    try {
      setLoading(true);
      await userApi.bindEmail({ email: email.trim() });
      await loadUser();
      setModalMode(null);
      Alert.alert('成功', '邮箱绑定成功');
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '绑定邮箱失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('lastRoute');
          navigation.navigate('Login');
        },
      },
    ]);
  };

  const renderModalContent = () => {
    if (modalMode === 'profile') {
      return (
        <>
          <TextInput
            style={styles.modalInput}
            value={profileForm.nickname}
            onChangeText={(nickname) => setProfileForm((prev) => ({ ...prev, nickname }))}
            placeholder="昵称"
          />
          <ImageUploaderField
            value={profileForm.avatar}
            onChange={(avatar) => setProfileForm((prev) => ({ ...prev, avatar }))}
            uploadImage={userApi.uploadAvatar}
            label="头像"
            helperText="上传后会自动写入个人资料。"
          />
        </>
      );
    }

    if (modalMode === 'password') {
      return (
        <>
          <TextInput
            style={styles.modalInput}
            value={passwordForm.oldPassword}
            onChangeText={(oldPassword) => setPasswordForm((prev) => ({ ...prev, oldPassword }))}
            placeholder="旧密码"
            secureTextEntry
          />
          <TextInput
            style={styles.modalInput}
            value={passwordForm.newPassword}
            onChangeText={(newPassword) => setPasswordForm((prev) => ({ ...prev, newPassword }))}
            placeholder="新密码"
            secureTextEntry
          />
        </>
      );
    }

    return (
      <TextInput
        style={styles.modalInput}
        value={email}
        onChangeText={setEmail}
        placeholder="邮箱地址"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    );
  };

  const handleModalConfirm = async () => {
    if (modalMode === 'profile') {
      await handleUpdateUser();
      return;
    }
    if (modalMode === 'password') {
      await handleChangePassword();
      return;
    }
    await handleBindEmail();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          {user?.avatar ? (
            <Image source={{ uri: resolveMediaUrl(user.avatar) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{user?.nickname?.charAt(0) || '宠'}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nickname || '宠物主人'}</Text>
            <Text style={styles.profileMeta}>{user?.phone || '未设置手机号'}</Text>
            <Text style={styles.profileMeta}>{user?.email || '未绑定邮箱'}</Text>
          </View>
          <TouchableOpacity style={styles.editChip} onPress={openProfile}>
            <Text style={styles.editChipText}>编辑</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账户设置</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={openProfile}>
              <Text style={styles.menuText}>个人信息</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={openPassword}>
              <Text style={styles.menuText}>修改密码</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.lastItem]} onPress={openEmail}>
              <Text style={styles.menuText}>绑定邮箱</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知设置</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>推送通知</Text>
              <Switch value={notifications} onValueChange={setNotifications} />
            </View>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>深色模式</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>
            <View style={[styles.menuItem, styles.lastItem]}>
              <Text style={styles.menuText}>位置服务</Text>
              <Switch value={locationEnabled} onValueChange={setLocationEnabled} />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>退出登录</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalMode !== null} transparent animationType="fade" onRequestClose={() => setModalMode(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            {renderModalContent()}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondary} onPress={() => setModalMode(null)}>
                <Text style={styles.modalSecondaryText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimary} onPress={handleModalConfirm}>
                <Text style={styles.modalPrimaryText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 14,
  },
  avatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 14,
    backgroundColor: '#d8eee0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#296b4a',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 6,
  },
  profileMeta: {
    color: '#6d7a73',
    fontSize: 13,
    marginBottom: 2,
  },
  editChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#edf4ef',
  },
  editChipText: {
    color: '#2d6d4b',
    fontWeight: '600',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    marginBottom: 10,
    color: '#728078',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1ee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 15,
    color: '#243029',
    fontWeight: '500',
  },
  menuArrow: {
    color: '#8c9892',
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#d64d3d',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  modalSecondary: {
    backgroundColor: '#edf2ef',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modalSecondaryText: {
    color: '#55645d',
    fontWeight: '600',
  },
  modalPrimary: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modalPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
});

export default SettingsScreen;

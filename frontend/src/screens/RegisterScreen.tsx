import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feedback } from '../components/Feedback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';
import { authApi, getApiErrorMessage } from '../services/api';

interface RegisterFormData {
  phone: string;
  password: string;
  confirmPassword: string;
  nickname: string;
}

const RegisterScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'loading',
    message: '',
  });
  const { control, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>();
  const password = watch('password');

  const showFeedback = (type: 'success' | 'error' | 'loading', message: string) => {
    setFeedback({ visible: true, type, message });
  };

  const hideFeedback = () => {
    setFeedback({ ...feedback, visible: false });
  };

  const onSubmit = async (data: RegisterFormData) => {
    showFeedback('loading', '注册中...');
    setLoading(true);
    try {
      const response = await authApi.register({
        phone: data.phone,
        password: data.password,
        nickname: data.nickname,
      });
      showFeedback('success', '注册成功，欢迎加入宠物健康助手！');
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      setTimeout(() => {
        navigation.navigate('MainTabs');
      }, 1000);
    } catch (error: any) {
      showFeedback('error', getApiErrorMessage(error, '注册失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>宠物健康助手</Text>
      <Text style={styles.subtitle}>注册账号</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>手机号</Text>
          <Controller
            control={control}
            name="phone"
            rules={{ required: '请输入手机号', pattern: { value: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' } }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="请输入手机号"
                keyboardType="phone-pad"
              />
            )}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>密码</Text>
          <Controller
            control={control}
            name="password"
            rules={{ required: '请输入密码', minLength: { value: 6, message: '密码至少6位' } }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="请输入密码"
                secureTextEntry
              />
            )}
          />
          {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>确认密码</Text>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{ 
              required: '请确认密码',
              validate: value => value === password || '两次输入的密码不一致'
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="请再次输入密码"
                secureTextEntry
              />
            )}
          />
          {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>昵称</Text>
          <Controller
            control={control}
            name="nickname"
            rules={{ required: '请输入昵称' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="请输入昵称"
              />
            )}
          />
          {errors.nickname && <Text style={styles.error}>{errors.nickname.message}</Text>}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '注册中...' : '注册'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>已有账号？立即登录</Text>
        </TouchableOpacity>
      </View>
      <Feedback
        visible={feedback.visible}
        type={feedback.type}
        message={feedback.message}
        onClose={hideFeedback}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 60,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  error: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#4CAF50',
    fontSize: 14,
  },
});

export default RegisterScreen;

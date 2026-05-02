import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feedback } from '../components/Feedback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';
import { authApi, getApiDiagnostics, getApiErrorMessage } from '../services/api';

interface LoginFormData {
  phone: string;
  password: string;
}

const LoginScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [debugError, setDebugError] = useState('');
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'loading',
    message: '',
  });
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const apiDiagnostics = getApiDiagnostics();

  const showFeedback = (type: 'success' | 'error' | 'loading', message: string) => {
    setFeedback({ visible: true, type, message });
  };

  const hideFeedback = () => {
    setFeedback({ ...feedback, visible: false });
  };

  const onSubmit = async (data: LoginFormData) => {
    showFeedback('loading', '登录中...');
    setLoading(true);
    setDebugError('');
    try {
      const response = await authApi.login(data);
      showFeedback('success', '登录成功，欢迎回来！');
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      setTimeout(() => {
        navigation.navigate('Home');
      }, 1000);
    } catch (error: any) {
      const errorSummary = [
        `message: ${error?.message || 'unknown'}`,
        `code: ${error?.code || ''}`,
        `status: ${error?.response?.status || ''}`,
        `response: ${
          typeof error?.response?.data === 'string'
            ? error.response.data
            : JSON.stringify(error?.response?.data || {})
        }`,
      ].join('\n');
      setDebugError(errorSummary);
      console.log('[login-debug]', {
        apiDiagnostics,
        errorMessage: error?.message,
        errorCode: error?.code,
        responseStatus: error?.response?.status,
        responseData: error?.response?.data,
      });
      showFeedback('error', getApiErrorMessage(error, '手机号或密码错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>宠物健康助手</Text>
      <Text style={styles.subtitle}>登录账号</Text>

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

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '登录中...' : '登录'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>还没有账号？立即注册</Text>
        </TouchableOpacity>

        {__DEV__ ? (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>调试信息</Text>
            <Text style={styles.debugText}>API_BASE_URL: {apiDiagnostics.apiBaseUrl}</Text>
            <Text style={styles.debugText}>expoConfig.hostUri: {apiDiagnostics.expoConfigHostUri || '-'}</Text>
            <Text style={styles.debugText}>experienceUrl: {apiDiagnostics.experienceUrl || '-'}</Text>
            <Text style={styles.debugText}>linkingUri: {apiDiagnostics.linkingUri || '-'}</Text>
            <Text style={styles.debugText}>platform.hostUri: {apiDiagnostics.platformHostUri || '-'}</Text>
            <Text style={styles.debugText}>debuggerHost: {apiDiagnostics.expoDebuggerHost || '-'}</Text>
            <Text style={styles.debugText}>scriptURL: {apiDiagnostics.sourceCodeScriptURL || '-'}</Text>
            <Text style={styles.debugText}>ServerHost: {apiDiagnostics.platformServerHost || '-'}</Text>
            {debugError ? <Text style={styles.debugErrorText}>{debugError}</Text> : null}
          </View>
        ) : null}
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
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  debugCard: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eef5ff',
    borderWidth: 1,
    borderColor: '#c8daf5',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27496d',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#355c7d',
    marginBottom: 4,
  },
  debugErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#b42318',
    lineHeight: 18,
  },
});

export default LoginScreen;

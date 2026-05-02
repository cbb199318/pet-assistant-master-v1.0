import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { Feedback } from '../components/Feedback';
import ProviderQuickSelect from '../components/ProviderQuickSelect';
import RecordImageUploader from '../components/RecordImageUploader';
import { getApiErrorMessage, healthApi } from '../services/api';

interface AddVaccinationFormData {
  vaccine_name: string;
  vaccination_date: string;
  next_date: string;
  hospital: string;
  doctor: string;
  record_image_url: string;
  notes: string;
}

const AddVaccinationScreen = ({ navigation, route }: any) => {
  const { pet } = route.params;
  const record = route.params?.record;
  const isEdit = Boolean(record);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [providerOptions, setProviderOptions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'loading',
    message: '',
  });
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<AddVaccinationFormData>({
    defaultValues: {
      vaccine_name: record?.vaccine_name || '',
      vaccination_date: record?.vaccination_date
        ? new Date(record.vaccination_date).toISOString().split('T')[0]
        : '',
      next_date: record?.next_date ? new Date(record.next_date).toISOString().split('T')[0] : '',
      hospital: record?.hospital || '',
      doctor: record?.doctor || '',
      record_image_url: record?.record_image_url || '',
      notes: record?.notes || '',
    },
  });

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setProviderOptions(await healthApi.getProviderOptions());
      } catch {
        setProviderOptions([]);
      }
    };

    void loadProviders();
  }, []);

  const showFeedback = (type: 'success' | 'error' | 'loading', message: string) => {
    setFeedback({ visible: true, type, message });
  };

  const hideFeedback = () => {
    setFeedback((current) => ({ ...current, visible: false }));
  };

  const applyRecognizedResult = (fields: Record<string, string>, imageUrl: string) => {
    setValue('vaccine_name', fields.vaccine_name || '');
    setValue('vaccination_date', fields.vaccination_date || '');
    setValue('next_date', fields.next_date || '');
    setValue('hospital', fields.hospital || '');
    setValue('doctor', fields.doctor || '');
    setValue('notes', fields.notes || '');
    setValue('record_image_url', imageUrl);
  };

  const recognizeFromImage = async (source: 'camera' | 'library') => {
    setOcrLoading(true);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('提示', source === 'camera' ? '需要相机权限才能拍照识别' : '需要相册权限才能选择图片识别');
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const response = await healthApi.recognizeRecordImage(result.assets[0].uri, 'vaccination');
      applyRecognizedResult(response.fields, response.imageUrl);
      Alert.alert('识别完成', response.message);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '识别疫苗记录失败'));
    } finally {
      setOcrLoading(false);
    }
  };

  const onSubmit = async (data: AddVaccinationFormData) => {
    showFeedback('loading', isEdit ? '更新疫苗接种记录中...' : '添加疫苗接种记录中...');
    setLoading(true);
    try {
      const payload = {
        pet_id: pet.id,
        vaccine_name: data.vaccine_name,
        vaccination_date: data.vaccination_date,
        next_date: data.next_date || undefined,
        hospital: data.hospital || undefined,
        doctor: data.doctor || undefined,
        record_image_url: data.record_image_url || undefined,
        notes: data.notes,
      };
      if (isEdit) {
        await healthApi.updateVaccination(record.id, payload);
      } else {
        await healthApi.createVaccination(payload);
      }
      showFeedback('success', isEdit ? '疫苗接种记录已更新' : '疫苗接种记录已添加');
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      showFeedback('error', getApiErrorMessage(error, '添加疫苗接种记录失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? '编辑疫苗接种记录' : '添加疫苗接种记录'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.ocrContainer}>
            <Text style={styles.ocrTitle}>智能识别</Text>
            <Text style={styles.ocrSubtitle}>支持拍照或从相册识别疫苗本，自动回填疫苗名称、日期和机构信息。</Text>
            <View style={styles.ocrActionRow}>
              <TouchableOpacity
                style={[styles.ocrButton, ocrLoading && styles.ocrButtonDisabled]}
                disabled={ocrLoading}
                onPress={() => void recognizeFromImage('camera')}
              >
                <Text style={styles.ocrButtonText}>{ocrLoading ? '识别中...' : '拍照识别'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ocrButton, styles.secondaryOcrButton, ocrLoading && styles.ocrButtonDisabled]}
                disabled={ocrLoading}
                onPress={() => void recognizeFromImage('library')}
              >
                <Text style={[styles.ocrButtonText, styles.secondaryOcrButtonText]}>相册识别</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>疫苗名称 *</Text>
            <Controller
              control={control}
              name="vaccine_name"
              rules={{ required: '请输入疫苗名称' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="请输入疫苗名称" />
              )}
            />
            {errors.vaccine_name && <Text style={styles.error}>{errors.vaccine_name.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>接种日期 *</Text>
            <Controller
              control={control}
              name="vaccination_date"
              rules={{ required: '请输入接种日期' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="YYYY-MM-DD" />
              )}
            />
            {errors.vaccination_date && <Text style={styles.error}>{errors.vaccination_date.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>下次接种日期</Text>
            <Controller
              control={control}
              name="next_date"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="YYYY-MM-DD" />
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>接种医院</Text>
            <Controller
              control={control}
              name="hospital"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="可填写医院或门诊名称" />
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>医生姓名</Text>
            <Controller
              control={control}
              name="doctor"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="可填写接种医生" />
              )}
            />
          </View>

          <ProviderQuickSelect
            providers={providerOptions}
            onSelect={(provider) => {
              setValue('hospital', provider.hospital);
              setValue('doctor', provider.doctor);
            }}
          />

          <Controller
            control={control}
            name="record_image_url"
            render={({ field: { onChange, value } }) => (
              <RecordImageUploader value={value} onChange={onChange} />
            )}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>备注</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="请输入备注信息"
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? '提交中...' : isEdit ? '保存修改' : '添加记录'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Feedback visible={feedback.visible} type={feedback.type} message={feedback.message} onClose={hideFeedback} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { color: '#fff', fontSize: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, minHeight: 0, padding: 20 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ocrContainer: {
    backgroundColor: '#f7fbf7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dce8de',
  },
  ocrTitle: { fontSize: 15, fontWeight: '700', color: '#243029', marginBottom: 6 },
  ocrSubtitle: { fontSize: 13, color: '#6f7c75', lineHeight: 18, marginBottom: 12 },
  ocrActionRow: { flexDirection: 'row', gap: 10 },
  ocrButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryOcrButton: { backgroundColor: '#edf3ee' },
  ocrButtonText: { color: '#fff', fontWeight: '700' },
  secondaryOcrButtonText: { color: '#466755' },
  ocrButtonDisabled: { opacity: 0.65 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  error: { color: '#ff4d4f', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddVaccinationScreen;

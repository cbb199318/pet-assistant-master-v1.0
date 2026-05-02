import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { Feedback } from '../components/Feedback';
import ProviderQuickSelect from '../components/ProviderQuickSelect';
import RecordImageUploader from '../components/RecordImageUploader';
import { getApiErrorMessage, healthApi } from '../services/api';

interface AddDewormingFormData {
  product_name: string;
  type: 'internal' | 'external' | 'both';
  deworming_date: string;
  next_date: string;
  hospital: string;
  doctor: string;
  record_image_url: string;
  notes: string;
}

const AddDewormingScreen = ({ navigation, route }: any) => {
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
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<AddDewormingFormData>({
    defaultValues: {
      product_name: record?.product_name || '',
      type: record?.type || 'internal',
      deworming_date: record?.deworming_date
        ? new Date(record.deworming_date).toISOString().split('T')[0]
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
    setValue('product_name', fields.product_name || '');
    setValue('type', ((fields.type || 'internal') as 'internal' | 'external' | 'both'));
    setValue('deworming_date', fields.deworming_date || '');
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

      const response = await healthApi.recognizeRecordImage(result.assets[0].uri, 'deworming');
      applyRecognizedResult(response.fields, response.imageUrl);
      Alert.alert('识别完成', response.message);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '识别驱虫记录失败'));
    } finally {
      setOcrLoading(false);
    }
  };

  const onSubmit = async (data: AddDewormingFormData) => {
    showFeedback('loading', isEdit ? '更新驱虫记录中...' : '添加驱虫记录中...');
    setLoading(true);
    try {
      const payload = {
        pet_id: pet.id,
        product_name: data.product_name,
        type: data.type,
        deworming_date: data.deworming_date,
        next_date: data.next_date || undefined,
        hospital: data.hospital || undefined,
        doctor: data.doctor || undefined,
        record_image_url: data.record_image_url || undefined,
        notes: data.notes,
      };
      if (isEdit) {
        await healthApi.updateDeworming(record.id, payload);
      } else {
        await healthApi.createDeworming(payload);
      }
      showFeedback('success', isEdit ? '驱虫记录已更新' : '驱虫记录已添加');
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      showFeedback('error', getApiErrorMessage(error, '添加驱虫记录失败'));
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
        <Text style={styles.title}>{isEdit ? '编辑驱虫记录' : '添加驱虫记录'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.ocrContainer}>
            <Text style={styles.ocrTitle}>智能识别</Text>
            <Text style={styles.ocrSubtitle}>支持拍摄驱虫卡片、处方单或相册图片，自动回填产品与日期信息。</Text>
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
            <Text style={styles.label}>产品名称 *</Text>
            <Controller
              control={control}
              name="product_name"
              rules={{ required: '请输入产品名称' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="请输入驱虫产品名称" />
              )}
            />
            {errors.product_name && <Text style={styles.error}>{errors.product_name.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>驱虫类型 *</Text>
            <Controller
              control={control}
              name="type"
              rules={{ required: '请选择驱虫类型' }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.typeContainer}>
                  {[
                    ['internal', '体内'],
                    ['external', '体外'],
                    ['both', '体内外'],
                  ].map(([optionValue, label]) => (
                    <TouchableOpacity
                      key={optionValue}
                      style={[styles.typeOption, value === optionValue && styles.typeOptionActive]}
                      onPress={() => onChange(optionValue)}
                    >
                      <Text style={[styles.typeText, value === optionValue && styles.typeTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.type && <Text style={styles.error}>{errors.type.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>驱虫日期 *</Text>
            <Controller
              control={control}
              name="deworming_date"
              rules={{ required: '请输入驱虫日期' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="YYYY-MM-DD" />
              )}
            />
            {errors.deworming_date && <Text style={styles.error}>{errors.deworming_date.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>下次驱虫日期</Text>
            <Controller
              control={control}
              name="next_date"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="YYYY-MM-DD" />
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>执行医院/门诊</Text>
            <Controller
              control={control}
              name="hospital"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="可填写医院、门店或门诊" />
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>医生/护理人</Text>
            <Controller
              control={control}
              name="doctor"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="可填写医生或执行人" />
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

          <Controller control={control} name="record_image_url" render={({ field: { onChange, value } }) => <RecordImageUploader value={value} onChange={onChange} />} />

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
  typeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  typeOption: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  typeOptionActive: { backgroundColor: '#4CAF50' },
  typeText: { fontSize: 16, color: '#333' },
  typeTextActive: { color: '#fff' },
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

export default AddDewormingScreen;

import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { Feedback } from '../components/Feedback';
import ProviderQuickSelect from '../components/ProviderQuickSelect';
import RecordImageUploader from '../components/RecordImageUploader';
import { getApiErrorMessage, healthApi } from '../services/api';

interface AddCheckupFormData {
  hospital: string;
  checkup_date: string;
  doctor: string;
  weight: string;
  temperature: string;
  diagnosis: string;
  recommendations: string;
  record_image_url: string;
}

const AddCheckupScreen = ({ navigation, route }: any) => {
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
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<AddCheckupFormData>({
    defaultValues: {
      hospital: record?.hospital || '',
      checkup_date: record?.checkup_date
        ? new Date(record.checkup_date).toISOString().split('T')[0]
        : '',
      doctor: record?.doctor || '',
      weight: record?.weight ? String(record.weight) : '',
      temperature: record?.temperature ? String(record.temperature) : '',
      diagnosis: record?.diagnosis || '',
      recommendations: record?.recommendations || '',
      record_image_url: record?.record_image_url || '',
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
    setValue('hospital', fields.hospital || '');
    setValue('checkup_date', fields.checkup_date || '');
    setValue('doctor', fields.doctor || '');
    setValue('weight', fields.weight || '');
    setValue('temperature', fields.temperature || '');
    setValue('diagnosis', fields.diagnosis || '');
    setValue('recommendations', fields.recommendations || '');
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

      const response = await healthApi.recognizeRecordImage(result.assets[0].uri, 'checkup');
      applyRecognizedResult(response.fields, response.imageUrl);
      Alert.alert('识别完成', response.message);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '识别体检记录失败'));
    } finally {
      setOcrLoading(false);
    }
  };

  const onSubmit = async (data: AddCheckupFormData) => {
    showFeedback('loading', isEdit ? '更新体检记录中...' : '添加体检记录中...');
    setLoading(true);
    try {
      const payload = {
        pet_id: pet.id,
        hospital: data.hospital,
        checkup_date: data.checkup_date,
        doctor: data.doctor || undefined,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        temperature: data.temperature ? parseFloat(data.temperature) : undefined,
        diagnosis: data.diagnosis || undefined,
        recommendations: data.recommendations || undefined,
        record_image_url: data.record_image_url || undefined,
      };

      if (isEdit) {
        await healthApi.updateCheckup(record.id, payload);
      } else {
        await healthApi.createCheckup(payload);
      }

      showFeedback('success', isEdit ? '体检记录已更新' : '体检记录已添加');
      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      showFeedback('error', getApiErrorMessage(error, '保存体检记录失败'));
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
        <Text style={styles.title}>{isEdit ? '编辑体检记录' : '添加体检记录'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.ocrContainer}>
            <Text style={styles.ocrTitle}>智能识别</Text>
            <Text style={styles.ocrSubtitle}>支持拍照或从相册识别体检单、处方单与化验单，自动回填医院、医生和诊断信息。</Text>
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
            <Text style={styles.label}>医院名称 *</Text>
            <Controller
              control={control}
              name="hospital"
              rules={{ required: '请输入医院名称' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="请输入医院名称" />
              )}
            />
            {errors.hospital && <Text style={styles.error}>{errors.hospital.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>体检日期 *</Text>
            <Controller
              control={control}
              name="checkup_date"
              rules={{ required: '请输入体检日期' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="YYYY-MM-DD" />
              )}
            />
            {errors.checkup_date && <Text style={styles.error}>{errors.checkup_date.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>医生姓名</Text>
            <Controller
              control={control}
              name="doctor"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="请输入医生姓名" />
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

          <View style={styles.inlineRow}>
            <View style={[styles.inputContainer, styles.inlineInput]}>
              <Text style={styles.label}>体重 (kg)</Text>
              <Controller
                control={control}
                name="weight"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="请输入体重"
                    keyboardType="decimal-pad"
                  />
                )}
              />
            </View>

            <View style={[styles.inputContainer, styles.inlineInput]}>
              <Text style={styles.label}>体温 (℃)</Text>
              <Controller
                control={control}
                name="temperature"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="请输入体温"
                    keyboardType="decimal-pad"
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>诊断结果</Text>
            <Controller
              control={control}
              name="diagnosis"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="请输入诊断结果"
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>医生建议</Text>
            <Controller
              control={control}
              name="recommendations"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="请输入医生建议"
                  multiline
                  numberOfLines={4}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="record_image_url"
            render={({ field: { onChange, value } }) => (
              <RecordImageUploader
                value={value}
                onChange={onChange}
                label="体检单/化验单"
                helperText="拍照保存体检报告、处方或化验单，回看时更直观。"
              />
            )}
          />

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    minHeight: 0,
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ocrContainer: {
    backgroundColor: '#f2fbf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d7ead9',
  },
  ocrTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f4d2c',
    marginBottom: 6,
  },
  ocrSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#52705d',
    marginBottom: 12,
  },
  ocrActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ocrButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryOcrButton: {
    backgroundColor: '#edf5ee',
  },
  ocrButtonDisabled: {
    opacity: 0.65,
  },
  ocrButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryOcrButtonText: {
    color: '#40614c',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddCheckupScreen;

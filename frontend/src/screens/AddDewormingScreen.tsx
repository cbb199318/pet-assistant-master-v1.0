import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feedback } from '../components/Feedback';
import { useForm, Controller } from 'react-hook-form';
import { getApiErrorMessage, healthApi } from '../services/api';

interface AddDewormingFormData {
  product_name: string;
  type: 'internal' | 'external' | 'both';
  deworming_date: string;
  next_date: string;
  notes: string;
}

const AddDewormingScreen = ({ navigation, route }: any) => {
  const { pet } = route.params;
  const record = route.params?.record;
  const isEdit = Boolean(record);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'loading',
    message: '',
  });
  const { control, handleSubmit, formState: { errors } } = useForm<AddDewormingFormData>({
    defaultValues: {
      product_name: record?.product_name || '',
      type: record?.type || 'internal',
      deworming_date: record?.deworming_date
        ? new Date(record.deworming_date).toISOString().split('T')[0]
        : '',
      next_date: record?.next_date ? new Date(record.next_date).toISOString().split('T')[0] : '',
      notes: record?.notes || '',
    },
  });

  const showFeedback = (type: 'success' | 'error' | 'loading', message: string) => {
    setFeedback({ visible: true, type, message });
  };

  const hideFeedback = () => {
    setFeedback({ ...feedback, visible: false });
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
        notes: data.notes,
      };
      if (isEdit) {
        await healthApi.updateDeworming(record.id, payload);
      } else {
        await healthApi.createDeworming(payload);
      }
      showFeedback('success', isEdit ? '驱虫记录已更新' : '驱虫记录已添加');
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>产品名称 *</Text>
            <Controller
              control={control}
              name="product_name"
              rules={{ required: '请输入产品名称' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="请输入驱虫产品名称"
                />
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
                  <TouchableOpacity
                    style={[styles.typeOption, value === 'internal' && styles.typeOptionActive]}
                    onPress={() => onChange('internal')}
                  >
                    <Text style={[styles.typeText, value === 'internal' && styles.typeTextActive]}>体内</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, value === 'external' && styles.typeOptionActive]}
                    onPress={() => onChange('external')}
                  >
                    <Text style={[styles.typeText, value === 'external' && styles.typeTextActive]}>体外</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, value === 'both' && styles.typeOptionActive]}
                    onPress={() => onChange('both')}
                  >
                    <Text style={[styles.typeText, value === 'both' && styles.typeTextActive]}>体内外</Text>
                  </TouchableOpacity>
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
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="YYYY-MM-DD"
                />
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
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="YYYY-MM-DD"
                />
              )}
            />
          </View>

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

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '提交中...' : isEdit ? '保存修改' : '添加记录'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  inputContainer: {
    marginBottom: 20,
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
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#4CAF50',
  },
  typeText: {
    fontSize: 16,
    color: '#333',
  },
  typeTextActive: {
    color: '#fff',
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
});

export default AddDewormingScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feedback } from '../components/Feedback';
import { careApi, getApiErrorMessage } from '../services/api';
import { useNavigation, useRoute } from '@react-navigation/native';

const AddCareScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { pet_id } = route.params as { pet_id: number };
  const care = route.params?.care;
  const isEdit = Boolean(care);

  const [type, setType] = useState(care?.type || 'feeding');
  const [description, setDescription] = useState(care?.description || '');
  const [date, setDate] = useState(
    care?.date ? new Date(care.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  );
  const [time, setTime] = useState(care?.time || new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [duration, setDuration] = useState(care?.duration ? String(care.duration) : '');
  const [quantity, setQuantity] = useState(care?.quantity || '');
  const [notes, setNotes] = useState(care?.notes || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'loading',
    message: '',
  });

  const careTypes = [
    { value: 'feeding', label: '喂食' },
    { value: 'walking', label: '遛狗' },
    { value: 'grooming', label: '美容' },
    { value: 'bathing', label: '洗澡' },
    { value: 'play', label: '玩耍' },
    { value: 'other', label: '其他' },
  ];

  const showFeedback = (type: 'success' | 'error' | 'loading', message: string) => {
    setFeedback({ visible: true, type, message });
  };

  const hideFeedback = () => {
    setFeedback({ ...feedback, visible: false });
  };

  const handleSubmit = async () => {
    showFeedback('loading', isEdit ? '更新护理记录中...' : '添加护理记录中...');
    setLoading(true);
    try {
      const payload = {
        type,
        description,
        date,
        time,
        duration: duration ? parseInt(duration) : undefined,
        quantity: quantity || undefined,
        notes,
        pet_id,
      };
      if (isEdit) {
        await careApi.updateCare(care.id, payload);
      } else {
        await careApi.createCare(payload);
      }
      showFeedback('success', isEdit ? '护理记录已更新' : '护理记录添加成功');
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      showFeedback('error', getApiErrorMessage(error, '添加护理记录失败，请重试'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEdit ? '编辑护理记录' : '添加护理记录'}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>护理类型</Text>
          <View style={styles.typeContainer}>
            {careTypes.map((careType) => (
              <TouchableOpacity
                key={careType.value}
                style={[styles.typeOption, type === careType.value && styles.typeOptionActive]}
                onPress={() => setType(careType.value)}
              >
                <Text style={[styles.typeOptionText, type === careType.value && styles.typeOptionTextActive]}>
                  {careType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="请输入护理描述"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>日期</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>时间</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>持续时间（分钟）</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="可选"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>数量</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="如食物量，可选"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>备注</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="可选"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '保存中...' : isEdit ? '保存修改' : '保存'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={[styles.buttonText, styles.cancelButtonText]}>取消</Text>
        </TouchableOpacity>
      </View>
      <Feedback
        visible={feedback.visible}
        type={feedback.type}
        message={feedback.message}
        onClose={hideFeedback}
      />
    </ScrollView>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  typeOptionText: {
    color: '#333',
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  cancelButtonText: {
    color: '#fff',
  },
});

export default AddCareScreen;

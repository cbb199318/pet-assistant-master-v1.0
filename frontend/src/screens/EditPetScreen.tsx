import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import DatePickerField from '../components/DatePickerField';
import ImageUploaderField from '../components/ImageUploaderField';
import { getApiErrorMessage, petApi } from '../services/api';

interface EditPetFormData {
  name: string;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  sterilized: boolean;
  avatar: string;
}

const EditPetScreen = ({ navigation, route }: any) => {
  const { pet } = route.params;
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<EditPetFormData>({
    defaultValues: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      gender: pet.gender,
      birthday: pet.birthday ? new Date(pet.birthday).toISOString().split('T')[0] : '',
      sterilized: pet.sterilized,
      avatar: pet.avatar || '',
    },
  });

  const onSubmit = async (data: EditPetFormData) => {
    setLoading(true);
    try {
      await petApi.updatePet(pet.id, data);
      Alert.alert('成功', '宠物档案已更新');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '更新宠物档案失败'));
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
        <Text style={styles.title}>编辑宠物</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>宠物名字 *</Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: '请输入宠物名字' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="请输入宠物名字"
                />
              )}
            />
            {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>宠物种类 *</Text>
            <Controller
              control={control}
              name="species"
              rules={{ required: '请输入宠物种类' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="例如：猫、狗、兔子等"
                />
              )}
            />
            {errors.species && <Text style={styles.error}>{errors.species.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>品种</Text>
            <Controller
              control={control}
              name="breed"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="例如：金毛、泰迪、布偶等"
                />
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>性别</Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[styles.genderOption, value === 'male' && styles.genderOptionActive]}
                    onPress={() => onChange('male')}
                  >
                    <Text style={[styles.genderText, value === 'male' && styles.genderTextActive]}>公</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, value === 'female' && styles.genderOptionActive]}
                    onPress={() => onChange('female')}
                  >
                    <Text style={[styles.genderText, value === 'female' && styles.genderTextActive]}>母</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>生日</Text>
            <Controller
              control={control}
              name="birthday"
              render={({ field: { onChange, value } }) => (
                <DatePickerField
                  value={value}
                  onChange={onChange}
                  placeholder="请选择生日"
                  title="选择宠物生日"
                  allowClear
                />
              )}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>是否绝育</Text>
              <Controller
                control={control}
                name="sterilized"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#ccc', true: '#4CAF50' }}
                    thumbColor="#fff"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="avatar"
            render={({ field: { onChange, value } }) => (
              <ImageUploaderField
                value={value}
                onChange={onChange}
                uploadImage={petApi.uploadAvatar}
                label="宠物头像"
                helperText="重新上传后会直接替换当前宠物头像。"
              />
            )}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '更新中...' : '更新宠物'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  error: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#4CAF50',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  genderTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default EditPetScreen;

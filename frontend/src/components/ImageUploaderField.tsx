import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { resolveMediaUrl } from '../services/api';

interface ImageUploaderFieldProps {
  value?: string;
  onChange: (value: string) => void;
  uploadImage: (uri: string) => Promise<{ url: string }>;
  label?: string;
  helperText?: string;
}

const ImageUploaderField = ({
  value,
  onChange,
  uploadImage,
  label = '图片',
  helperText = '支持拍照上传或从相册选择。',
}: ImageUploaderFieldProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUploadAsset = async (uri?: string) => {
    if (!uri) {
      return;
    }

    setUploading(true);
    try {
      const response = await uploadImage(uri);
      onChange(response.url);
    } finally {
      setUploading(false);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      await handleUploadAsset(result.assets?.[0]?.uri);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      await handleUploadAsset(result.assets?.[0]?.uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.helperText}>{helperText}</Text>

      <View style={styles.actionRow}>
        {Platform.OS !== 'web' ? (
          <TouchableOpacity
            style={[styles.actionButton, uploading && styles.disabledButton]}
            disabled={uploading}
            onPress={() => void pickFromCamera()}
          >
            <Text style={styles.actionButtonText}>拍照上传</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.actionButton, uploading && styles.disabledButton]}
          disabled={uploading}
          onPress={() => void pickFromLibrary()}
        >
          <Text style={styles.actionButtonText}>相册选择</Text>
        </TouchableOpacity>
        {value ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            disabled={uploading}
            onPress={() => onChange('')}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>移除图片</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {uploading ? (
        <View style={styles.uploadingState}>
          <ActivityIndicator color="#4CAF50" />
          <Text style={styles.uploadingText}>图片上传中...</Text>
        </View>
      ) : null}

      {value ? (
        <Image source={{ uri: resolveMediaUrl(value) }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>上传后会在页面中直接回显</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#7a847d',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#edf2ef',
  },
  secondaryButtonText: {
    color: '#506159',
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  uploadingText: {
    color: '#5e6c64',
    fontSize: 13,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e5dc',
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#fbfdfb',
  },
  placeholderText: {
    color: '#7a847d',
    fontSize: 13,
  },
});

export default ImageUploaderField;

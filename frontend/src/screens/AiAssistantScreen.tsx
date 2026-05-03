import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import {
  aiApi,
  type AiConversationSummary,
  type AiConversationMessage,
  type PetSummary,
  getApiErrorMessage,
  petApi,
  resolveMediaUrl,
} from '../services/api';
import PetAvatar from '../components/PetAvatar';
import { useVoiceRecorder, type PendingAudioDraft } from '../hooks/useVoiceRecorder';
import { resolvePrimaryPet } from '../utils/primaryPet';

const welcomeMessage: AiConversationMessage = {
  role: 'assistant',
  type: 'text',
  content:
    '你好，我是你的宠物助手。你可以直接问我宠物健康、护理、饮食和行为问题，也可以上传图片或录一段语音让我帮你识别。',
};

const MIN_AUDIO_FILE_SIZE = 1024;

const hasDirectMediaScheme = (value?: string) =>
  Boolean(
    value &&
      (/^https?:\/\//i.test(value) ||
        value.startsWith('data:') ||
        value.startsWith('file:') ||
        value.startsWith('blob:') ||
        value.startsWith('content:') ||
        value.startsWith('ph:') ||
        value.startsWith('asset-library:') ||
        value.startsWith('assets-library:')),
  );

const getPlayableAudioUri = (value?: string) => {
  if (!value) {
    return '';
  }

  return hasDirectMediaScheme(value) ? value : resolveMediaUrl(value);
};

const getAudioFileExtension = (mimeType: string) => {
  if (mimeType.includes('mp4')) {
    return '.m4a';
  }
  if (mimeType.includes('ogg')) {
    return '.ogg';
  }
  if (mimeType.includes('mpeg')) {
    return '.mp3';
  }
  return '.webm';
};

const isFallbackMessage = (content?: string) =>
  Boolean(content && /(暂未配置|无法提供|稍后再试)/.test(content));

const AiAssistantScreen = () => {
  const flatListRef = useRef<FlatList>(null);
  const hasResolvedInitialPetRef = useRef(false);
  const voiceRecorder = useVoiceRecorder();
  const audioPlayer = useAudioPlayer(null);
  const audioPlayerStatus = useAudioPlayerStatus(audioPlayer);
  const [messages, setMessages] = useState<AiConversationMessage[]>([]);
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetSummary | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [petsLoading, setPetsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sendingMode, setSendingMode] = useState<'text' | 'image' | 'audio' | null>(null);
  const [pendingImage, setPendingImage] = useState<any | null>(null);
  const [pendingAudio, setPendingAudio] = useState<PendingAudioDraft | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [petSelectorVisible, setPetSelectorVisible] = useState(false);
  const isWebVoiceMode = Platform.OS === 'web' && inputMode === 'voice';
  const webRecordingUnavailableReason = voiceRecorder.recordingUnavailableReason;

  const displayMessages = useMemo(
    () => (messages.length > 0 ? messages : [welcomeMessage]),
    [messages],
  );

  const stopAudioPlayback = useCallback(
    (clearActiveUrl: boolean = true) => {
      try {
        audioPlayer.pause();
      } catch {}

      audioPlayer.seekTo(0).catch(() => {});

      if (clearActiveUrl) {
        setActiveAudioUrl(null);
      }
    },
    [audioPlayer],
  );

  const loadConversations = async (preferredConversationId?: number | null) => {
    try {
      const response = await aiApi.getConversations();
      setConversations(response);

      if (preferredConversationId && response.some((item) => item.id === preferredConversationId)) {
        setActiveConversationId(preferredConversationId);
      }
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取会话历史失败'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPets = async (preferredPetId?: number | null) => {
    try {
      const response = await petApi.getPets();
      setPets(response);

      if (preferredPetId !== undefined) {
        setSelectedPet(
          preferredPetId === null
            ? null
            : response.find((pet) => pet.id === preferredPetId) || null,
        );
        hasResolvedInitialPetRef.current = true;
        return;
      }

      if (!hasResolvedInitialPetRef.current) {
        const primaryPet = await resolvePrimaryPet(response);
        setSelectedPet(primaryPet);
        hasResolvedInitialPetRef.current = true;
        return;
      }

      setSelectedPet((currentPet: PetSummary | null) => {
        if (!currentPet) {
          return currentPet;
        }
        return response.find((pet) => pet.id === currentPet.id) || response[0] || null;
      });
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取宠物档案失败'));
    } finally {
      setPetsLoading(false);
    }
  };

  const loadConversationDetail = async (conversationId: number) => {
    setDetailLoading(true);
    stopAudioPlayback();
    try {
      const response = await aiApi.getConversationDetail(conversationId);
      setActiveConversationId(response.id);
      setMessages(response.messages || []);
      setSelectedPet(response.pet || null);
      setPendingImage(null);
      setPendingAudio(null);
      setHistoryModalVisible(false);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '获取会话详情失败'));
    } finally {
      setDetailLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setHistoryLoading(true);
      setPetsLoading(true);
      loadConversations(activeConversationId);
      loadPets(selectedPet?.id);
    }, [activeConversationId, selectedPet?.id]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 120);

    return () => clearTimeout(timer);
  }, [displayMessages, pendingImage, pendingAudio]);

  useEffect(() => {
    if (audioPlayerStatus.didJustFinish) {
      setActiveAudioUrl(null);
    }
  }, [audioPlayerStatus.didJustFinish]);

  useEffect(() => {
    return () => {
      stopAudioPlayback();
    };
  }, [stopAudioPlayback]);

  const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  };

  const handleStartNewConversation = () => {
    stopAudioPlayback();
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
    setPendingImage(null);
    setPendingAudio(null);
    setShowAttachmentMenu(false);
    setInputMode('text');
    setHistoryModalVisible(false);
  };

  const toggleInputMode = () => {
    if (sendingMode !== null || voiceRecorder.isRecording) {
      return;
    }

    setShowAttachmentMenu(false);
    setInputMode((currentMode) => {
      const nextMode = currentMode === 'text' ? 'voice' : 'text';
      if (nextMode === 'voice') {
        Keyboard.dismiss();
      }
      return nextMode;
    });
  };

  const handleDeleteConversation = (conversationId: number) => {
    Alert.alert('确认删除', '删除后无法恢复，确定删除这段会话吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await aiApi.deleteConversation(conversationId);
            if (activeConversationId === conversationId) {
              handleStartNewConversation();
            }
            await loadConversations(null);
          } catch (error: any) {
            Alert.alert('错误', getApiErrorMessage(error, '删除会话失败'));
          }
        },
      },
    ]);
  };

  const applyPetSelection = (nextPet: PetSummary | null) => {
    const currentPetId = selectedPet?.id || null;
    const nextPetId = nextPet?.id || null;
    if (currentPetId === nextPetId) {
      setPetSelectorVisible(false);
      return;
    }

    if (messages.length > 0 || activeConversationId !== null) {
      Alert.alert(
        '切换咨询宠物',
        '切换宠物上下文会开始一个新的 AI 对话，避免把不同宠物的信息混在一起。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '切换并新建',
            onPress: () => {
              handleStartNewConversation();
              setSelectedPet(nextPet);
              setPetSelectorVisible(false);
            },
          },
        ],
      );
      return;
    }

    setSelectedPet(nextPet);
    setPetSelectorVisible(false);
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('提示', '需要相册权限才能上传图片');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setPendingAudio(null);
      setPendingImage(result.assets[0]);
      setShowAttachmentMenu(false);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '选择图片失败'));
    }
  };

  const captureImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('提示', '需要相机权限才能拍照上传');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setPendingAudio(null);
      setPendingImage(result.assets[0]);
      setShowAttachmentMenu(false);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '拍照失败'));
    }
  };


  const toggleAudioPlayback = async (uri: string) => {
    try {
      const normalizedUri = getPlayableAudioUri(uri);
      if (!normalizedUri) {
        return;
      }

      if (activeAudioUrl === normalizedUri) {
        if (audioPlayerStatus.playing) {
          audioPlayer.pause();
        } else {
          audioPlayer.play();
        }
        return;
      }

      stopAudioPlayback(false);
      audioPlayer.replace(normalizedUri);
      setActiveAudioUrl(normalizedUri);
      audioPlayer.play();
    } catch (error: any) {
      setActiveAudioUrl(null);
      Alert.alert('错误', getApiErrorMessage(error, '播放语音失败'));
    }
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) {
      return;
    }

    const userMessage: AiConversationMessage = {
      role: 'user',
      type: 'text',
      content: inputText.trim(),
    };
    const outgoingMessages = [...messages, userMessage];

    setMessages(outgoingMessages);
    setInputText('');
    setSendingMode('text');

    try {
      const response = await aiApi.chat({
        messages: outgoingMessages,
        conversationId: activeConversationId || undefined,
        petId: selectedPet?.id,
      });

      const assistantMessage: AiConversationMessage = {
        role: 'assistant',
        type: 'text',
        content: response.response,
        responseAudioUrl: response.responseAudioUrl,
      };

      setMessages([...outgoingMessages, assistantMessage]);
      setActiveConversationId(response.conversationId);
      await loadConversations(response.conversationId);

      if (response.responseAudioUrl) {
        void toggleAudioPlayback(response.responseAudioUrl);
      }
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '发送消息失败，请重试'));
    } finally {
      setSendingMode(null);
    }
  };

  const buildImageFormData = async (asset: any) => {
    const formData = new FormData();
    const prompt = inputText.trim();

    if (prompt) {
      formData.append('prompt', prompt);
    }
    if (activeConversationId) {
      formData.append('conversationId', String(activeConversationId));
    }
    if (selectedPet?.id) {
      formData.append('petId', String(selectedPet.id));
    }

    const fileName =
      asset.fileName ||
      asset.name ||
      asset.uri?.split('/').pop() ||
      `pet-image-${Date.now()}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';

    if (Platform.OS === 'web') {
      if (asset.file) {
        formData.append('image', asset.file);
      } else {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('image', blob, fileName);
      }
      return formData;
    }

    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    if (!fileInfo.exists) {
      throw new Error('图片文件不存在，请重新选择');
    }

    formData.append('image', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as any);

    return formData;
  };

  const buildAudioFormData = async (audioDraft?: PendingAudioDraft) => {
    const resolvedAudio = audioDraft || pendingAudio;
    if (!resolvedAudio) {
      throw new Error('未选择语音文件');
    }

    const formData = new FormData();
    const prompt = inputText.trim();

    if (prompt) {
      formData.append('prompt', prompt);
    }
    if (activeConversationId) {
      formData.append('conversationId', String(activeConversationId));
    }
    if (selectedPet?.id) {
      formData.append('petId', String(selectedPet.id));
    }

    if (Platform.OS === 'web') {
      const response = await fetch(resolvedAudio.uri);
      const blob = await response.blob();
      if (blob.size < MIN_AUDIO_FILE_SIZE) {
        throw new Error('录音过短或没有采集到声音，请重试');
      }
      const mimeType = blob.type || resolvedAudio.mimeType || 'audio/webm';
      const fileName = `pet-audio-${Date.now()}${getAudioFileExtension(mimeType)}`;
      formData.append('audio', blob, fileName);
      return formData;
    }

    const fileInfo = await FileSystem.getInfoAsync(resolvedAudio.uri);
    if (!fileInfo.exists) {
      throw new Error('录音文件不存在，请重新录制');
    }
    if (typeof fileInfo.size === 'number' && fileInfo.size < MIN_AUDIO_FILE_SIZE) {
      throw new Error('录音过短或没有采集到声音，请重试');
    }

    formData.append('audio', {
      uri: resolvedAudio.uri,
      name: resolvedAudio.name,
      type: resolvedAudio.mimeType,
    } as any);

    return formData;
  };

  const sendImageMessage = async () => {
    if (!pendingImage) {
      return;
    }

    setSendingMode('image');
    try {
      const formData = await buildImageFormData(pendingImage);
      const response = await aiApi.analyzeImage(formData);

      const imageMessage: AiConversationMessage = {
        role: 'user',
        type: 'image',
        content: inputText.trim() || '请帮我识别这张宠物相关图片。',
        imageUrl: response.imageUrl,
      };
      const assistantMessage: AiConversationMessage = {
        role: 'assistant',
        type: 'text',
        content: response.response,
      };

      setMessages([...messages, imageMessage, assistantMessage]);
      setPendingImage(null);
      setInputText('');
      setActiveConversationId(response.conversationId);
      await loadConversations(response.conversationId);
    } catch (error: any) {
      Alert.alert('错误', getApiErrorMessage(error, '上传图片失败，请重试'));
    } finally {
      setSendingMode(null);
    }
  };

  const sendAudioMessage = async (audioDraft?: PendingAudioDraft) => {
    const resolvedAudio = audioDraft || pendingAudio;
    if (!resolvedAudio) {
      return;
    }

    const baseMessages = messages;
    const optimisticAudioMessage: AiConversationMessage = {
      role: 'user',
      type: 'audio',
      content: '正在转写语音...',
      audioUrl: resolvedAudio.uri,
    };

    setPendingAudio(resolvedAudio);
    setMessages([...baseMessages, optimisticAudioMessage]);
    setSendingMode('audio');
    try {
      const formData = await buildAudioFormData(resolvedAudio);
      const response = await aiApi.chatWithAudio(formData);

      const audioMessage: AiConversationMessage = {
        role: 'user',
        type: 'audio',
        content: response.transcript || '未能识别出清晰语音内容，请重试。',
        audioUrl: response.audioUrl,
      };
      const assistantMessage: AiConversationMessage = {
        role: 'assistant',
        type: 'text',
        content: response.response,
        responseAudioUrl: response.responseAudioUrl,
      };

      setMessages([...baseMessages, audioMessage, assistantMessage]);
      setPendingAudio(null);
      setInputText('');
      setActiveConversationId(response.conversationId);
      await loadConversations(response.conversationId);

      if (response.responseAudioUrl) {
        void toggleAudioPlayback(response.responseAudioUrl);
      }
    } catch (error: any) {
      setMessages(baseMessages);
      Alert.alert('错误', getApiErrorMessage(error, '上传语音失败，请重试'));
    } finally {
      setSendingMode(null);
    }
  };

  const handleSend = async () => {
    if (pendingImage) {
      await sendImageMessage();
      return;
    }

    if (pendingAudio) {
      await sendAudioMessage();
      return;
    }

    await sendTextMessage();
  };

  const renderMessage = ({ item }: { item: AiConversationMessage }) => {
    const messageAudioUrl = getPlayableAudioUri(item.audioUrl);
    const isActiveAudio =
      item.type === 'audio' &&
      Boolean(messageAudioUrl) &&
      activeAudioUrl === messageAudioUrl &&
      audioPlayerStatus.playing;

    const ttsAudioUrl = getPlayableAudioUri(item.responseAudioUrl);
    const isActiveTts =
      Boolean(ttsAudioUrl) &&
      activeAudioUrl === ttsAudioUrl &&
      audioPlayerStatus.playing;

    return (
      <View
        style={[
          styles.messageContainer,
          item.role === 'user' ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        {item.type === 'image' && item.imageUrl ? (
          <Image source={{ uri: resolveMediaUrl(item.imageUrl) }} style={styles.messageImage} />
        ) : null}
        {item.type === 'audio' ? (
          <View style={styles.audioMessageMeta}>
            <View style={styles.audioTag}>
              <Text style={styles.audioTagText}>🎤 语音输入</Text>
            </View>
            {item.audioUrl ? (
              <TouchableOpacity
                style={styles.audioPlayButton}
                onPress={() => void toggleAudioPlayback(item.audioUrl!)}
              >
                <Text style={styles.audioPlayButtonText}>
                  {isActiveAudio
                    ? `暂停 ${formatDuration(audioPlayerStatus.currentTime)}`
                    : '播放'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        <Text
          style={[
            styles.messageText,
            item.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
          ]}
        >
          {item.content}
        </Text>
        {item.role === 'assistant' && isFallbackMessage(item.content) ? (
          <Text style={styles.messageHintText}>可先体验图片上传、语音输入与语音播报界面，配置外部 Key 后即可返回真实 AI 结果。</Text>
        ) : null}
        {item.role === 'assistant' && ttsAudioUrl ? (
          <TouchableOpacity
            style={styles.ttsPlayButton}
            onPress={() => void toggleAudioPlayback(item.responseAudioUrl!)}
          >
            <Text style={styles.ttsPlayButtonText}>
              {isActiveTts
                ? `⏸ 暂停 ${formatDuration(audioPlayerStatus.currentTime)}`
                : '🔊 播放语音'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const selectedPetDescription = selectedPet
    ? [selectedPet.species, selectedPet.breed || '未知品种'].filter(Boolean).join(' · ')
    : '不绑定宠物档案，按通用问题提问';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>AI 宠物助手</Text>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={() => setHistoryModalVisible(true)}
        >
          <Text style={styles.headerActionButtonText}>对话历史</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contextBar}>
        <View style={styles.contextInfo}>
          <Text style={styles.contextLabel}>宠物档案联动</Text>
          <Text style={styles.contextValue}>
            {selectedPet
              ? `${selectedPet.name} · ${selectedPetDescription}`
              : '通用问题 · 不绑定自己的宠物档案'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.switchButton}
          activeOpacity={0.88}
          onPress={() => setPetSelectorVisible(true)}
        >
          <Text style={styles.switchButtonText}>
            {petsLoading ? '加载中...' : selectedPet ? '切换宠物' : '选择宠物'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayMessages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.role}-${item.type}-${index}`}
        contentContainerStyle={styles.messagesList}
      />

      {pendingImage ? (
        <View style={styles.pendingCard}>
          <Image source={{ uri: pendingImage.uri }} style={styles.pendingImagePreview} />
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>已选择图片</Text>
            <Text style={styles.pendingSubtitle}>
              {inputText.trim()
                ? `会附带问题：${inputText.trim()}`
                : '可在输入框补充识别要求，或直接发送。'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setPendingImage(null)} style={styles.pendingClose}>
            <Text style={styles.pendingCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {pendingAudio ? (
        <View style={styles.pendingCard}>
          <View style={styles.pendingAudioPreview}>
            <Text style={styles.pendingAudioIcon}>🎤</Text>
          </View>
          <View style={styles.pendingContent}>
            <Text style={styles.pendingTitle}>已录制语音</Text>
            <Text style={styles.pendingSubtitle}>
              时长约 {formatDuration(pendingAudio.durationSeconds)}
              {inputText.trim()
                ? `，会附带说明：${inputText.trim()}`
                : '，发送后会先转写再问答。'}
            </Text>
            <TouchableOpacity
              style={styles.pendingAudioPlayButton}
              onPress={() => void toggleAudioPlayback(pendingAudio.uri)}
            >
              <Text style={styles.pendingAudioPlayText}>
                {activeAudioUrl === getPlayableAudioUri(pendingAudio.uri) &&
                audioPlayerStatus.playing
                  ? `暂停预听 ${formatDuration(audioPlayerStatus.currentTime)}`
                  : '播放预听'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setPendingAudio(null)} style={styles.pendingClose}>
            <Text style={styles.pendingCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {sendingMode ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {sendingMode === 'image'
              ? 'AI 正在分析图片...'
              : sendingMode === 'audio'
                ? 'AI 正在转写语音并思考...'
                : 'AI 正在思考...'}
          </Text>
        </View>
      ) : null}

      {showAttachmentMenu ? (
        <View style={styles.attachmentMenu}>
          <TouchableOpacity
            style={styles.attachmentAction}
            onPress={pickImage}
            disabled={sendingMode !== null || voiceRecorder.recorderState.isRecording}
          >
            <View style={[styles.attachmentIcon, styles.attachmentAlbumIcon]}>
              <Text style={styles.attachmentIconText}>图</Text>
            </View>
            <Text style={styles.attachmentActionText}>相册</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachmentAction}
            onPress={captureImage}
            disabled={sendingMode !== null || voiceRecorder.recorderState.isRecording}
          >
            <View style={[styles.attachmentIcon, styles.attachmentCameraIcon]}>
              <Text style={styles.attachmentIconText}>拍</Text>
            </View>
            <Text style={styles.attachmentActionText}>拍照</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.modeToggleButton, sendingMode !== null && styles.actionButtonDisabled]}
          onPress={toggleInputMode}
          disabled={sendingMode !== null || voiceRecorder.recorderState.isRecording}
        >
          <Text style={styles.modeToggleButtonText}>{inputMode === 'text' ? '语音' : '键盘'}</Text>
        </TouchableOpacity>
        {inputMode === 'voice' ? (
          isWebVoiceMode ? (
            <TouchableOpacity
              style={[
                styles.holdToTalkButton,
                (voiceRecorder.recorderState.isRecording || voiceRecorder.isRecording || voiceRecorder.isPreparing) &&
                  styles.holdToTalkButtonRecording,
                sendingMode !== null && styles.actionButtonDisabled,
              ]}
              onPress={() => {
                void voiceRecorder.toggleWebVoice().then((recordedAudio) => {
                  if (recordedAudio) {
                    setPendingImage(null);
                    setPendingAudio(recordedAudio);
                    setShowAttachmentMenu(false);
                    void sendAudioMessage(recordedAudio);
                  }
                });
              }}
              disabled={sendingMode !== null}
            >
              <Text style={styles.holdToTalkButtonText}>
                {webRecordingUnavailableReason
                  ? '当前浏览器无法录音'
                  : voiceRecorder.isRecording || voiceRecorder.isPreparing || voiceRecorder.recorderState.isRecording
                  ? '点击结束并发送'
                  : '点击开始录音'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.holdToTalkButton,
                (voiceRecorder.recorderState.isRecording || voiceRecorder.isRecording || voiceRecorder.isPreparing) &&
                  styles.holdToTalkButtonRecording,
                sendingMode !== null && styles.actionButtonDisabled,
              ]}
              onPressIn={() => void voiceRecorder.beginHoldToTalk()}
              onPressOut={() => {
                void voiceRecorder.finishHoldToTalk(false).then((recordedAudio) => {
                  if (recordedAudio) {
                    setPendingImage(null);
                    setPendingAudio(recordedAudio);
                    setShowAttachmentMenu(false);
                    void sendAudioMessage(recordedAudio);
                  }
                });
              }}
              onLongPress={() => {}}
              delayLongPress={0}
              onPress={() => {}}
              disabled={sendingMode !== null}
            >
              <Text style={styles.holdToTalkButtonText}>
                {voiceRecorder.isRecording || voiceRecorder.isPreparing || voiceRecorder.recorderState.isRecording ? '松开发送' : '按住 说话'}
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.inputShell}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                pendingImage
                  ? '可补充识别要求...'
                  : pendingAudio
                    ? '可补充语音场景说明...'
                    : '输入消息'
              }
              multiline
              maxLength={500}
              onFocus={() => setShowAttachmentMenu(false)}
            />
          </View>
        )}
        {!inputText.trim() && !pendingImage && !pendingAudio && sendingMode === null ? (
          <TouchableOpacity
            style={[
              styles.rightActionButton,
              styles.plusButton,
              showAttachmentMenu && styles.plusButtonActive,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              setShowAttachmentMenu((current) => !current);
            }}
            disabled={voiceRecorder.recorderState.isRecording}
          >
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.rightActionButton,
              styles.sendButton,
              sendingMode !== null && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={sendingMode !== null}
          >
            <Text style={styles.sendButtonText}>
              {sendingMode === 'image'
                ? '识别中'
                : sendingMode === 'audio'
                  ? '转写中'
                  : pendingImage
                    ? '发送'
                    : pendingAudio
                      ? '发送'
                      : sendingMode === 'text'
                        ? '发送中'
                        : '发送'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {voiceRecorder.isRecording || voiceRecorder.isPreparing ? (
        <View style={styles.recordingHintBar}>
          <Text style={styles.recordingHintText}>
            {isWebVoiceMode
              ? `正在录音 ${formatDuration(Math.round(voiceRecorder.recorderState.durationMillis / 1000))}，再点一次发送`
              : `正在录音 ${formatDuration(Math.round(voiceRecorder.recorderState.durationMillis / 1000))}，松开发送`}
          </Text>
        </View>
      ) : null}
      {voiceRecorder.recordingCancelled ? (
        <View style={styles.recordingHintBar}>
          <Text style={styles.recordingHintText}>录音已取消</Text>
        </View>
      ) : null}
      {isWebVoiceMode && webRecordingUnavailableReason ? (
        <View style={styles.recordingHintBar}>
          <Text style={styles.recordingHintText}>{webRecordingUnavailableReason}</Text>
        </View>
      ) : null}

      <Modal
        visible={historyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setHistoryModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.historyPanel}
            onPress={() => {}}
          >
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.historyPanelTitle}>对话历史</Text>
                <Text style={styles.historyPanelHint}>在这里切换历史会话，或新建一段新的聊天。</Text>
              </View>
              {detailLoading ? <ActivityIndicator size="small" color="#4CAF50" /> : null}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.historyPanelContent}
            >
              <TouchableOpacity
                style={[
                  styles.historyListItem,
                  activeConversationId === null && styles.historyListItemActive,
                ]}
                activeOpacity={0.88}
                onPress={handleStartNewConversation}
              >
                <View style={styles.historyListItemBody}>
                  <Text
                    style={[
                      styles.historyListItemTitle,
                      activeConversationId === null && styles.historyListItemTitleActive,
                    ]}
                  >
                    新建聊天
                  </Text>
                  <Text
                    style={[
                      styles.historyListItemSubtitle,
                      activeConversationId === null && styles.historyListItemSubtitleActive,
                    ]}
                  >
                    清空当前消息，按新的宠物上下文重新开始。
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyListItemAction,
                    activeConversationId === null && styles.historyListItemActionActive,
                  ]}
                >
                  {activeConversationId === null ? '当前' : '进入'}
                </Text>
              </TouchableOpacity>

              {historyLoading ? (
                <View style={styles.historyLoading}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                </View>
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <View
                    key={conversation.id}
                    style={[
                      styles.historyListItem,
                      activeConversationId === conversation.id && styles.historyListItemActive,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.historyListItemBody}
                      activeOpacity={0.88}
                      onPress={() => void loadConversationDetail(conversation.id)}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.historyListItemTitle,
                          activeConversationId === conversation.id &&
                            styles.historyListItemTitleActive,
                        ]}
                      >
                        {conversation.title}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.historyListItemSubtitle,
                          activeConversationId === conversation.id &&
                            styles.historyListItemSubtitleActive,
                        ]}
                      >
                        {conversation.pet?.name
                          ? `${conversation.pet.name} · ${conversation.lastMessagePreview || '暂无内容'}`
                          : conversation.lastMessagePreview || '暂无内容'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.historyDeleteButton}
                      onPress={() => handleDeleteConversation(conversation.id)}
                    >
                      <Text style={styles.historyDeleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.historyEmptyState}>
                  <Text style={styles.historyEmptyTitle}>还没有历史对话</Text>
                  <Text style={styles.historyEmptyText}>发出第一条消息后，这里就会自动保存聊天记录。</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={petSelectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPetSelectorVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPetSelectorVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.switcherPanel}
            onPress={() => {}}
          >
            <Text style={styles.switcherTitle}>宠物档案联动</Text>
            <Text style={styles.switcherHint}>默认跟随首页主宠物，也可以改成通用问题，不绑定自己的宠物。</Text>

            <TouchableOpacity
              style={[styles.petOptionRow, !selectedPet && styles.petOptionRowActive]}
              activeOpacity={0.88}
              onPress={() => applyPetSelection(null)}
            >
              <View style={styles.generalPetBadge}>
                <Text style={styles.generalPetBadgeText}>通用</Text>
              </View>
              <View style={styles.petOptionInfo}>
                <Text style={styles.petOptionName}>不选择自己的宠物</Text>
                <Text style={styles.petOptionMeta}>适合咨询通用的健康、护理和喂养问题。</Text>
              </View>
              <Text
                style={[
                  styles.petOptionState,
                  !selectedPet && styles.petOptionStateActive,
                ]}
              >
                {!selectedPet ? '当前' : '切换'}
              </Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petOptionRow,
                    selectedPet?.id === pet.id && styles.petOptionRowActive,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => applyPetSelection(pet)}
                >
                  <PetAvatar pet={pet} size={52} />
                  <View style={styles.petOptionInfo}>
                    <Text style={styles.petOptionName}>{pet.name}</Text>
                    <Text style={styles.petOptionMeta}>
                      {[pet.species, pet.breed || '未知品种'].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.petOptionState,
                      selectedPet?.id === pet.id && styles.petOptionStateActive,
                    ]}
                  >
                    {selectedPet?.id === pet.id ? '当前' : '切换'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingBottom: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActionButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  headerActionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  contextBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6eee8',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contextInfo: {
    flex: 1,
    paddingRight: 12,
  },
  contextLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#294236',
    marginBottom: 6,
  },
  contextValue: {
    fontSize: 13,
    lineHeight: 19,
    color: '#617169',
  },
  switchButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#edf6ee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  switchButtonText: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
  },
  messagesList: {
    flexGrow: 1,
    padding: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },
  messageContainer: {
    maxWidth: '82%',
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#dde4df',
  },
  audioTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 96, 190, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  audioTagText: {
    color: '#2c57a8',
    fontWeight: '700',
    fontSize: 12,
  },
  audioMessageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  audioPlayButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(45, 130, 86, 0.12)',
  },
  audioPlayButtonText: {
    color: '#1f6f45',
    fontWeight: '700',
    fontSize: 12,
  },
  ttsPlayButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(45, 130, 86, 0.12)',
  },
  ttsPlayButtonText: {
    color: '#1f6f45',
    fontWeight: '700',
    fontSize: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageHintText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7c73',
  },
  userMessageText: {
    color: '#1976D2',
  },
  assistantMessageText: {
    color: '#333',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  pendingImagePreview: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#dde4df',
  },
  pendingAudioPreview: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAudioIcon: {
    fontSize: 28,
  },
  pendingContent: {
    flex: 1,
    marginLeft: 12,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243029',
  },
  pendingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: '#6d7c73',
  },
  pendingAudioPlayButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#eef6f0',
  },
  pendingAudioPlayText: {
    color: '#2a6d44',
    fontWeight: '600',
    fontSize: 12,
  },
  pendingClose: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingCloseText: {
    fontSize: 22,
    color: '#8b9891',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    color: '#607068',
  },
  recordingHintBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f7fbf7',
    borderTopWidth: 1,
    borderTopColor: '#e3ece5',
  },
  recordingHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#587164',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 22, 16, 0.38)',
    justifyContent: 'flex-end',
  },
  historyPanel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '78%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  historyPanelTitle: {
    color: '#223026',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  historyPanelHint: {
    color: '#718076',
    fontSize: 13,
    lineHeight: 18,
  },
  historyPanelContent: {
    paddingTop: 16,
    paddingBottom: 6,
  },
  historyLoading: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  historyListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6faf6',
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  historyListItemActive: {
    backgroundColor: '#e6f3e7',
  },
  historyListItemBody: {
    flex: 1,
    paddingRight: 10,
  },
  historyListItemTitle: {
    color: '#203025',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyListItemTitleActive: {
    color: '#1f5d36',
  },
  historyListItemSubtitle: {
    color: '#718076',
    fontSize: 13,
    lineHeight: 18,
  },
  historyListItemSubtitleActive: {
    color: '#547263',
  },
  historyListItemAction: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  historyListItemActionActive: {
    color: '#234d31',
  },
  historyDeleteButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(181, 72, 72, 0.10)',
  },
  historyDeleteButtonText: {
    color: '#b54848',
    fontSize: 13,
    fontWeight: '700',
  },
  historyEmptyState: {
    backgroundColor: '#f7fbf8',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  historyEmptyTitle: {
    color: '#243029',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  historyEmptyText: {
    color: '#6f7c73',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  switcherPanel: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '78%',
  },
  switcherTitle: {
    color: '#223026',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  switcherHint: {
    color: '#718076',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  generalPetBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff7df',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generalPetBadgeText: {
    color: '#7a5e1f',
    fontSize: 12,
    fontWeight: '800',
  },
  petOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6faf6',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  petOptionRowActive: {
    backgroundColor: '#e6f3e7',
  },
  petOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petOptionName: {
    color: '#203025',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  petOptionMeta: {
    color: '#718076',
    fontSize: 13,
    lineHeight: 18,
  },
  petOptionState: {
    color: '#2f6e43',
    fontSize: 13,
    fontWeight: '700',
  },
  petOptionStateActive: {
    color: '#234d31',
  },
  attachmentMenu: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: '#f4f4f4',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  attachmentAction: {
    alignItems: 'center',
    width: 76,
  },
  attachmentIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e7e7',
  },
  attachmentAlbumIcon: {
    backgroundColor: '#ffffff',
  },
  attachmentCameraIcon: {
    backgroundColor: '#ffffff',
  },
  attachmentIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#525252',
  },
  attachmentActionText: {
    fontSize: 12,
    color: '#606060',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: '#f7f7f7',
    borderTopWidth: 1,
    borderTopColor: '#dedede',
    alignItems: 'center',
  },
  modeToggleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#d4d4d4',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modeToggleButtonText: {
    color: '#4d4d4d',
    fontWeight: '700',
    fontSize: 11,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  inputShell: {
    flex: 1,
    minHeight: 52,
    maxHeight: 132,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingLeft: 14,
    paddingRight: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  input: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    maxHeight: 132,
    textAlignVertical: 'top',
  },
  holdToTalkButton: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  holdToTalkButtonRecording: {
    backgroundColor: '#e8e8e8',
  },
  holdToTalkButtonText: {
    color: '#333333',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  rightActionButton: {
    width: 38,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d4d4d4',
  },
  plusButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  plusButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#575757',
    fontWeight: '400',
  },
  sendButton: {
    width: 64,
    backgroundColor: '#07c160',
  },
  sendButtonDisabled: {
    backgroundColor: '#8bcf9f',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default AiAssistantScreen;

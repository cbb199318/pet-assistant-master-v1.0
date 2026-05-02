import { useCallback, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { getApiErrorMessage } from '../services/api';

const MIN_RECORD_DURATION_MS = 1000;

function getWebRecordingUnavailableReason() {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return '当前页面不是安全上下文。手机浏览器通过局域网 HTTP 地址访问时，浏览器通常会直接拦截麦克风。请改用 HTTPS 地址，或直接使用 Expo Go 真机调试。';
  }

  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return '当前浏览器没有开放网页麦克风能力。请换系统浏览器最新版，或改用 Expo Go 真机调试。';
  }

  if (typeof MediaRecorder === 'undefined') {
    return '当前浏览器不支持网页录音。请换支持录音的系统浏览器，或改用 Expo Go 真机调试。';
  }

  return null;
}

export type PendingAudioDraft = {
  uri: string;
  mimeType: string;
  name: string;
  durationSeconds: number;
};

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordingCancelled, setRecordingCancelled] = useState(false);

  const sessionActiveRef = useRef(false);
  const startPromiseRef = useRef<Promise<boolean> | null>(null);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const unavailableReason = getWebRecordingUnavailableReason();
      if (unavailableReason) {
        Alert.alert('无法开始录音', unavailableReason);
        return false;
      }

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('提示', '需要麦克风权限才能录制语音');
        return false;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      sessionActiveRef.current = true;
      setRecordingCancelled(false);
      return true;
    } catch (error: any) {
      sessionActiveRef.current = false;
      Alert.alert('错误', getApiErrorMessage(error, '开始录音失败'));
      return false;
    }
  }, [recorder]);

  const stopRecording = useCallback(
    async (cancelled: boolean = false): Promise<PendingAudioDraft | null> => {
      try {
        if (!sessionActiveRef.current) {
          return null;
        }

        await recorder.stop();
        sessionActiveRef.current = false;
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        if (cancelled) {
          setRecordingCancelled(true);
          return null;
        }

        const recorderUri = recorder.uri || recorderState.url;
        if (!recorderUri) {
          Alert.alert('错误', '未获取到录音文件，请重试');
          return null;
        }

        if (recorderState.durationMillis < MIN_RECORD_DURATION_MS) {
          Alert.alert('提示', '录音太短，请按住说话至少 1 秒');
          return null;
        }

        const recordedAudio: PendingAudioDraft = {
          uri: recorderUri,
          mimeType: Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4',
          name: `pet-audio-${Date.now()}${Platform.OS === 'web' ? '.webm' : '.m4a'}`,
          durationSeconds: Math.max(1, Math.round(recorderState.durationMillis / 1000)),
        };

        setRecordingCancelled(false);
        return recordedAudio;
      } catch (error: any) {
        sessionActiveRef.current = false;
        Alert.alert('错误', getApiErrorMessage(error, '结束录音失败'));
        return null;
      } finally {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        }).catch(() => {});
      }
    },
    [recorder, recorderState],
  );

  const beginHoldToTalk = useCallback(async () => {
    if (isPreparing || isRecording || sessionActiveRef.current) {
      return;
    }

    setIsPreparing(true);
    setRecordingCancelled(false);
    const startPromise = startRecording();
    startPromiseRef.current = startPromise;
    const started = await startPromise;
    setIsPreparing(false);
    if (startPromiseRef.current === startPromise) {
      startPromiseRef.current = null;
    }

    if (started) {
      setIsRecording(true);
    }
  }, [isPreparing, isRecording, startRecording]);

  const finishHoldToTalk = useCallback(
    async (cancelled = false): Promise<PendingAudioDraft | null> => {
      setIsRecording(false);
      setIsPreparing(false);

      const startPromise = startPromiseRef.current;
      if (startPromise) {
        const started = await startPromise;
        if (startPromiseRef.current === startPromise) {
          startPromiseRef.current = null;
        }
        if (!started) {
          return null;
        }
      }

      if (!sessionActiveRef.current) {
        return null;
      }

      return stopRecording(cancelled);
    },
    [stopRecording],
  );

  const toggleWebVoice = useCallback(async (): Promise<PendingAudioDraft | null> => {
    if (isPreparing) {
      return null;
    }

    if (isRecording || sessionActiveRef.current) {
      setIsRecording(false);
      setIsPreparing(false);
      return stopRecording(false);
    }

    setIsPreparing(true);
    setRecordingCancelled(false);
    const started = await startRecording();
    setIsPreparing(false);
    if (started) {
      setIsRecording(true);
    }
    return null;
  }, [isPreparing, isRecording, startRecording, stopRecording]);

  const cancelRecording = useCallback(async () => {
    setIsRecording(false);
    setIsPreparing(false);
    await stopRecording(true);
  }, [stopRecording]);

  const canRecord = !isRecording && !isPreparing;
  const recordingUnavailableReason = getWebRecordingUnavailableReason();

  return {
    isRecording,
    isPreparing,
    recordingCancelled,
    canRecord,
    recorderState,
    recordingUnavailableReason,
    beginHoldToTalk,
    finishHoldToTalk,
    toggleWebVoice,
    cancelRecording,
  };
}

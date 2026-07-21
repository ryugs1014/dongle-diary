import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useDiaryStore } from '../store/useDiaryStore';

export default function LockSettingsScreen() {
  const {
    isLockEnabled,
    setLockEnabled,
    pinCode,
    setPinCode,
    isBiometricEnabled,
    setBiometricEnabled,
  } = useDiaryStore();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinStep, setPinStep] = useState<'setup' | 'confirm' | 'change'>(
    'setup',
  );
  const [tempPin, setTempPin] = useState('');
  const [currentInput, setCurrentInput] = useState('');

  const handleLockToggle = (value: boolean) => {
    if (value) {
      setPinStep('setup');
      setCurrentInput('');
      setPinModalVisible(true);
    } else {
      setLockEnabled(false);
      setPinCode(null);
      setBiometricEnabled(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return Alert.alert(
          '지원 불가',
          '이 기기는 생체 인식을 지원하지 않습니다.',
        );
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return Alert.alert(
          '설정 필요',
          '기기에 등록된 생체 정보가 없습니다. 기기 설정에서 먼저 등록해주세요.',
        );
      }

      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: '생체 인식을 활성화합니다.',
        cancelLabel: '취소',
      });

      if (auth.success) {
        setBiometricEnabled(true);
      } else {
        // 팝업이 무시되었거나, 권한이 없어서 실패한 경우 사용자에게 설정으로 갈지 물어봅니다.
        Alert.alert(
          '권한 필요',
          '생체 인식을 사용하려면 Face ID 권한이 필요합니다. 설정으로 이동하여 권한을 허용하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => Linking.openSettings(), // 사용자를 아이폰의 해당 앱 설정 창으로 다이렉트로 보냅니다.
            },
          ],
        );
        setBiometricEnabled(false);
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  const handleNumberPress = (num: string) => {
    if (currentInput.length < 4) {
      const newInput = currentInput + num;
      setCurrentInput(newInput);

      if (newInput.length === 4) {
        setTimeout(() => processPin(newInput), 200);
      }
    }
  };

  const handleDeletePress = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const processPin = (inputPin: string) => {
    if (pinStep === 'setup' || pinStep === 'change') {
      setTempPin(inputPin);
      setCurrentInput('');
      setPinStep('confirm');
    } else if (pinStep === 'confirm') {
      if (inputPin === tempPin) {
        setPinCode(inputPin);
        setLockEnabled(true);
        setPinModalVisible(false);
        Alert.alert('완료', '비밀번호가 성공적으로 설정되었습니다.');
      } else {
        Alert.alert(
          '불일치',
          '비밀번호가 일치하지 않습니다. 다시 입력해주세요.',
        );
        setCurrentInput('');
      }
    }
  };

  const closePinModal = () => {
    setPinModalVisible(false);
    setCurrentInput('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{ headerTitle: '화면 잠금', headerBackTitle: '설정' }}
      />

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <AppText style={styles.settingTitle}>화면 잠금</AppText>
          <Switch
            value={isLockEnabled}
            onValueChange={handleLockToggle}
            trackColor={{ true: '#FF6F61', false: '#ddd' }}
          />
        </View>

        <AppTouchableOpacity
          style={[styles.settingItem, !isLockEnabled && { opacity: 0.5 }]}
          disabled={!isLockEnabled}
          onPress={() => {
            setPinStep('change');
            setCurrentInput('');
            setPinModalVisible(true);
          }}
        >
          <AppText style={styles.settingTitle}>비밀번호 변경</AppText>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </AppTouchableOpacity>

        <View style={[styles.settingItem, !isLockEnabled && { opacity: 0.5 }]}>
          <View>
            <AppText style={styles.settingTitle}>생체 인식 사용</AppText>
            <AppText style={styles.settingSub}>
              지문이나 Face ID로 잠금을 해제합니다.
            </AppText>
          </View>
          <Switch
            value={isBiometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={!isLockEnabled}
            trackColor={{ true: '#FF6F61', false: '#ddd' }}
          />
        </View>
      </View>

      <Modal
        visible={pinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <AppTouchableOpacity onPress={closePinModal}>
              <AppText style={styles.cancelText}>취소</AppText>
            </AppTouchableOpacity>
          </View>

          <View style={styles.pinArea}>
            <AppText style={styles.pinTitle}>
              {pinStep === 'setup' || pinStep === 'change'
                ? '새 비밀번호 입력'
                : '비밀번호 확인'}
            </AppText>
            <AppText style={styles.pinSub}>
              {pinStep === 'confirm'
                ? '한 번 더 입력해주세요.'
                : '4자리 숫자를 입력해주세요.'}
            </AppText>

            <View style={styles.dotContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    currentInput.length > i && styles.dotFilled,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.keypad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <AppTouchableOpacity
                key={num}
                style={styles.keypadBtn}
                onPress={() => handleNumberPress(num)}
              >
                <AppText style={styles.keypadText}>{num}</AppText>
              </AppTouchableOpacity>
            ))}

            <View style={styles.keypadBtn} />

            <AppTouchableOpacity
              style={styles.keypadBtn}
              onPress={() => handleNumberPress('0')}
            >
              <AppText style={styles.keypadText}>0</AppText>
            </AppTouchableOpacity>

            <AppTouchableOpacity
              style={styles.keypadBtn}
              onPress={handleDeletePress}
            >
              <Ionicons name="backspace-outline" size={28} color="#333" />
            </AppTouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTitle: { fontSize: 16, color: '#333' },
  settingSub: { fontSize: 12, color: '#888', marginTop: 4 },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { padding: 20, alignItems: 'flex-start' },
  cancelText: { fontSize: 16, color: '#FF6F61', fontWeight: 'bold' },
  pinArea: { alignItems: 'center', marginTop: 40 },
  pinTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  pinSub: { fontSize: 14, color: '#888', marginBottom: 40 },
  dotContainer: { flexDirection: 'row', gap: 20 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: '#FF6F61', borderColor: '#FF6F61' },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  keypadBtn: {
    width: '30%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
  },
  keypadText: { fontSize: 28, color: '#333' },
});

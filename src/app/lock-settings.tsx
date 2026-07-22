import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Linking,
  useColorScheme,
} from 'react-native';
import AppTouchableOpacity from '@/components/AppTouchableOpacity';
import AppText from '@/components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useDiaryStore } from '../store/useDiaryStore';
import NumberKeypad from '@/components/NumberKeypad';
import { BackIcon, CloseIcon, ArrowRightIcon } from '@/assets/icons';
import CustomSwitch from '@/components/CustomSwitch';

export default function LockSettingsScreen() {
  const {
    theme,
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

  const systemColorScheme = useColorScheme();
  const isDark =
    theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';

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
        Alert.alert(
          '권한 필요',
          '생체 인식을 사용하려면 Face ID 권한이 필요합니다. 설정으로 이동하여 권한을 허용하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => Linking.openSettings(),
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentInput.length < 4) {
      const newInput = currentInput + num;
      setCurrentInput(newInput);

      if (newInput.length === 4) {
        setTimeout(() => processPin(newInput), 200);
      }
    }
  };

  const handleDeletePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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

  const SettingItem = ({
    title,
    subtitle,
    onPress,
    rightElement,
    disabled,
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <AppTouchableOpacity
      style={[
        styles.settingItem,
        subtitle && styles.settingItemWithSub,
        disabled && { opacity: 0.2 },
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <AppText style={[styles.settingTitle, isDark && styles.darkText]}>
          {title}
        </AppText>
        {subtitle && (
          <AppText style={[styles.settingSub, isDark && styles.darkSubText]}>
            {subtitle}
          </AppText>
        )}
      </View>

      <View style={[styles.settingRight, disabled && { opacity: 0 }]}>
        {rightElement ? (
          rightElement
        ) : (
          <ArrowRightIcon
            width={28}
            height={28}
            color={isDark ? '#666' : '#ccc'}
          />
        )}
      </View>
    </AppTouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.leftIconsWrapper}>
          <AppTouchableOpacity onPress={() => router.back()}>
            <BackIcon
              width={28}
              height={28}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </AppTouchableOpacity>
        </View>
        <View style={styles.headerTitleWrapper}>
          <AppText
            style={[styles.customHeaderTitle, isDark && styles.darkText]}
          >
            암호 잠금
          </AppText>
        </View>
        <View style={styles.rightIconsWrapper} />
      </View>

      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
      >
        <SettingItem
          title="화면 잠금"
          rightElement={
            <CustomSwitch
              value={isLockEnabled}
              onValueChange={handleLockToggle}
              isDark={isDark}
            />
          }
        />

        {/*<View style={styles.dividerWrapper}>*/}
        {/*  <SvgDashedLine />*/}
        {/*</View>*/}

        <SettingItem
          title="비밀번호 변경"
          disabled={!isLockEnabled}
          onPress={() => {
            setPinStep('change');
            setCurrentInput('');
            setPinModalVisible(true);
          }}
        />

        {/*<View style={styles.dividerWrapper}>*/}
        {/*  <SvgDashedLine />*/}
        {/*</View>*/}

        <SettingItem
          title="생체 인식 사용"
          subtitle="지문이나 Face ID로 잠금을 해제합니다."
          disabled={!isLockEnabled}
          rightElement={
            <CustomSwitch
              value={isBiometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!isLockEnabled}
              isDark={isDark}
            />
          }
        />
      </ScrollView>

      <Modal
        visible={pinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          style={[styles.modalContainer, isDark && styles.darkModalContainer]}
        >
          <View style={styles.modalHeader}>
            <AppTouchableOpacity onPress={closePinModal}>
              <CloseIcon
                width={28}
                height={28}
                color={isDark ? '#ffffff' : '#111111'}
              />
            </AppTouchableOpacity>
          </View>

          <View style={styles.pinArea}>
            <AppText style={[styles.pinTitle, isDark && styles.darkText]}>
              {pinStep === 'setup'
                ? '새 암호 입력'
                : pinStep === 'change'
                  ? '변경 암호 입력'
                  : '한 번 더 입력하세요'}
            </AppText>

            <View style={styles.dotContainer}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.dotWrapper}>
                  {currentInput.length > i ? (
                    <AppText
                      style={[styles.asterisk, isDark && styles.darkAsterisk]}
                    >
                      *
                    </AppText>
                  ) : (
                    <View style={[styles.dot, isDark && styles.darkDot]} />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.keypadWrapper}>
            <NumberKeypad
              onNumberPress={handleNumberPress}
              onDeletePress={handleDeletePress}
              showBiometric={false}
              isDark={isDark}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCFBFA' },
  darkContainer: { backgroundColor: '#111111' },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 50,
  },
  darkCustomHeader: {
    backgroundColor: '#111111',
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftIconsWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerTitleWrapper: {
    flex: 2,
    alignItems: 'center',
  },
  customHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightIconsWrapper: {
    flex: 1,
  },

  scrollWrapper: {
    paddingVertical: 10,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  settingItemWithSub: {
    height: 68,
  },
  settingLeft: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  darkText: { color: '#ffffff' },
  darkSubText: { color: '#aaa' },

  dividerWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  modalContainer: { flex: 1, backgroundColor: '#FCFBFA' },
  darkModalContainer: { backgroundColor: '#111111' },

  modalHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  pinArea: { alignItems: 'center', paddingTop: 40 },
  pinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 30,
    color: '#333',
  },

  dotContainer: { flexDirection: 'row', gap: 20 },
  dotWrapper: {
    width: 24,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  asterisk: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    paddingTop: 12,
  },
  darkAsterisk: {
    color: '#ffffff',
  },
  dot: {
    width: 16,
    height: 2,
    backgroundColor: '#ccc',
  },
  darkDot: {
    backgroundColor: '#555',
  },

  keypadWrapper: {
    marginTop: 'auto',
    paddingBottom: 30,
  },
});

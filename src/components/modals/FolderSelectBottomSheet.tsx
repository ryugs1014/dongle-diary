import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  FlatList,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import AppTouchableOpacity from '@/components/atoms/AppTouchableOpacity';
import AppText from '@/components/atoms/AppText';
import RadioSettingItem from '@/components/common/RadioSettingItem';
import AppPromptModal from '@/components/modals/AppPromptModal';
import Toast from 'react-native-toast-message';
import { AddMemoIcon, EmptyEmotionIcon } from '@/assets/icons';

export interface FolderOption {
  id: string | null;
  name: string;
  // 🔥 아이콘 이름(string), 이모지(string), SVG 컴포넌트 모두 받을 수 있도록 타입 확장
  icon?: string | React.ElementType;
}

interface FolderSelectBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: FolderOption[];
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  onCreateFolder?: (name: string) => void;
  isDark: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
const HALF_OFFSET = SCREEN_HEIGHT * 0.4;
const HIDDEN_OFFSET = SCREEN_HEIGHT;

export default function FolderSelectBottomSheet({
  visible,
  onClose,
  title,
  options,
  selectedId,
  onSelect,
  onCreateFolder,
  isDark,
}: FolderSelectBottomSheetProps) {
  const panY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const footerHeight = useRef(new Animated.Value(HALF_OFFSET)).current;
  const lastSnap = useRef(HIDDEN_OFFSET);

  const flatListRef = useRef<FlatList>(null);
  const prevOptionsLength = useRef(options.length);

  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (options.length > prevOptionsLength.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
    prevOptionsLength.current = options.length;
  }, [options.length]);

  const snapTo = (yValue: number) => {
    lastSnap.current = yValue;
    panY.flattenOffset();

    Animated.parallel([
      Animated.spring(panY, {
        toValue: yValue,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(footerHeight, {
        toValue: yValue === 0 ? 0 : HALF_OFFSET,
        tension: 60,
        friction: 10,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleClose = () => {
    lastSnap.current = HIDDEN_OFFSET;
    panY.flattenOffset();
    Animated.timing(panY, {
      toValue: HIDDEN_OFFSET,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      panY.stopAnimation();
      panY.setOffset(0);
      panY.setValue(HIDDEN_OFFSET);
      footerHeight.setValue(HALF_OFFSET);
      snapTo(HALF_OFFSET);
    } else {
      panY.stopAnimation();
      panY.setOffset(0);
      panY.setValue(HIDDEN_OFFSET);
      lastSnap.current = HIDDEN_OFFSET;
    }
  }, [visible, panY, footerHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        panY.stopAnimation();
        panY.setOffset(lastSnap.current);
        panY.setValue(0);
      },

      onPanResponderMove: Animated.event([null, { dy: panY }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (_, gestureState) => {
        panY.flattenOffset();

        if (Math.abs(gestureState.dy) < 5) {
          snapTo(lastSnap.current);
          return;
        }

        const nextY =
          lastSnap.current + gestureState.dy + gestureState.vy * 200;

        if (nextY > SCREEN_HEIGHT * 0.6) {
          handleClose();
        } else if (nextY > SCREEN_HEIGHT * 0.2) {
          snapTo(HALF_OFFSET);
        } else {
          snapTo(0);
        }
      },
    }),
  ).current;

  const clampedY = panY.interpolate({
    inputRange: [0, HIDDEN_OFFSET],
    outputRange: [0, HIDDEN_OFFSET],
    extrapolate: 'clamp',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <AppTouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.bottomSheet,
            isDark && styles.darkBottomSheet,
            { transform: [{ translateY: clampedY }] },
          ]}
        >
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
            {title && (
              <AppText style={[styles.title, isDark && styles.darkTitle]}>
                {title}
              </AppText>
            )}
          </View>

          <FlatList
            ref={flatListRef}
            data={options}
            keyExtractor={(item) => item.id || 'null'}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={[styles.divider, isDark && styles.darkDivider]} />
            )}
            ListFooterComponent={
              <>
                {onCreateFolder && (
                  <>
                    <View
                      style={[styles.divider, isDark && styles.darkDivider]}
                    />
                    <AppTouchableOpacity
                      style={styles.createFolderBtn}
                      onPress={() => {
                        setNewFolderName('');
                        setIsPromptVisible(true);
                      }}
                    >
                      <AddMemoIcon
                        width={24}
                        height={24}
                        color={isDark ? '#ffffff' : '#111111'}
                      />
                      <AppText
                        style={[
                          styles.createFolderText,
                          isDark && styles.createFolderTextDark,
                        ]}
                      >
                        신규 폴더 생성
                      </AppText>
                    </AppTouchableOpacity>
                  </>
                )}
                <Animated.View style={{ height: footerHeight }} />
              </>
            }
            renderItem={({ item }) => (
              <RadioSettingItem
                title={item.name}
                icon={item.icon} // 🔥 iconName 대신 icon 하나로 전달
                isSelected={selectedId === item.id}
                isDark={isDark}
                onPress={() => {
                  lastSnap.current = HIDDEN_OFFSET;
                  panY.flattenOffset();
                  Animated.timing(panY, {
                    toValue: HIDDEN_OFFSET,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => {
                    onSelect(item.id);
                    onClose();
                  });
                }}
              />
            )}
          />
        </Animated.View>

        <AppPromptModal
          visible={isPromptVisible}
          title="새 폴더 생성"
          value={newFolderName}
          onChangeText={setNewFolderName}
          placeholder="폴더 이름을 입력하세요"
          onCancel={() => setIsPromptVisible(false)}
          onConfirm={() => {
            const trimmedName = newFolderName.trim();
            if (!trimmedName) return;

            const isDuplicate = options.some((opt) => opt.name === trimmedName);

            if (isDuplicate) {
              Toast.show({
                type: 'info',
                text1: '같은 이름의 폴더가 있어요',
                position: 'top',
                topOffset: 60,
              });
              return;
            }

            if (onCreateFolder) {
              onCreateFolder(trimmedName);
            }
            setIsPromptVisible(false);
            setNewFolderName('');
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MAX_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // elevation: 10,
    shadowColor: '#191919',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  darkBottomSheet: {
    backgroundColor: '#191919',
  },
  dragArea: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  darkTitle: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 40,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 20,
  },
  darkDivider: {
    backgroundColor: '#333',
  },
  createFolderBtn: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 20,
  },
  createFolderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  createFolderTextDark: {
    color: '#ffffff',
  },
});

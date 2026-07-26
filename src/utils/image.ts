// utils/image.ts

// 🔥 Expo 57+ 버전에서 기존 Async 함수들을 쓰려면 legacy가 맞습니다!
import * as FileSystem from 'expo-file-system/legacy';

// documentDirectory 끝에 이미 '/'가 있으므로 폴더명만 붙입니다.
export const IMAGE_DIR = `${FileSystem.documentDirectory}memo-images/`;

async function ensureImageDir() {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);

  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, {
      intermediates: true,
    });
  }
}

export async function saveClipboardImage(base64Data: string) {
  await ensureImageDir();

  // 🔥 헤더(data:image/jpeg;base64,)가 있다면 제거 후 순수 base64 데이터만 추출
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const fileName = `${Date.now()}.jpg`;
  const uri = IMAGE_DIR + fileName;

  await FileSystem.writeAsStringAsync(uri, cleanBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // WebView에서 읽을 수 있도록 file:// 프로토콜 보장
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

export async function saveBase64Image(
  base64: string,
  extension: string = 'jpg',
) {
  await ensureImageDir();

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const filename = `${Date.now()}.${extension}`;
  const uri = IMAGE_DIR + filename;

  await FileSystem.writeAsStringAsync(uri, cleanBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return uri.startsWith('file://') ? uri : `file://${uri}`;
}

export async function copyImageToMemoFolder(sourceUri: string) {
  await ensureImageDir();

  const extension = sourceUri.split('.').pop() || 'jpg';
  const destination = IMAGE_DIR + `${Date.now()}.${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destination,
  });

  return destination.startsWith('file://')
    ? destination
    : `file://${destination}`;
}

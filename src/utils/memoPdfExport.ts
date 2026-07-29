import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';

const getFontStyles = (fontId: string) => {
  switch (fontId) {
    case 'NanumSquareRound':
      return `
        @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.woff');
        body { font-family: 'NanumSquareRound', sans-serif; }
      `;
    case 'KyoboHandwriting':
      return `
        @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@1.0/KyoboHandwriting2019.woff');
        body { font-family: 'KyoboHandwriting2019', sans-serif; }
      `;
    case 'GowunBatang':
      return `
        @import url('https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap');
        body { font-family: 'Gowun Batang', serif; }
      `;
    case 'IsYun':
      return `
        @import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2202-2@1.0/LeeSeoyun.woff');
        body { font-family: 'LeeSeoyun', sans-serif; }
      `;
    default:
      return `body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }`;
  }
};

export const exportMemoToPdf = async (
  title: string,
  rawHtml: string,
  fontFamily: string,
  setIsSystemAction: (val: boolean) => void,
) => {
  try {
    let processedContent = rawHtml;
    // 메모 내부의 로컬 기기 파일 경로(file://)를 찾아서 PDF 렌더링용 Base64로 치환
    const regex = /src=["']?(file:\/\/[^"'\s>]+)["']?/gi;
    const matches = [...processedContent.matchAll(regex)];

    for (const match of matches) {
      const fileUri = match[1];
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          fileUri,
          [{ resize: { width: 600 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          },
        );
        if (manipResult.base64) {
          processedContent = processedContent.replace(
            fileUri,
            `data:image/jpeg;base64,${manipResult.base64}`,
          );
        }
      } catch (err) {
        try {
          const base64Image = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const ext = fileUri.toLowerCase().endsWith('png') ? 'png' : 'jpeg';
          processedContent = processedContent.replace(
            fileUri,
            `data:image/${ext};base64,${base64Image}`,
          );
        } catch (fsError) {
          console.log('PDF 메모 이미지 로드 실패:', fsError);
        }
      }
    }

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <meta charset="utf-8" />
          <style>
            ${getFontStyles(fontFamily || 'System')}
            body { margin: 30px; color: #333; line-height: 1.6; }
            .rich-content { font-size: 16px; margin-top: 10px; line-height: 1.6; }
            .rich-content img { max-width: 100%; height: auto !important; display: block; margin: 15px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="rich-content">${processedContent}</div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // 특수문자를 제거한 안전한 파일명 생성
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 20);
    const fileName = `${safeTitle}_메모.pdf`;
    const newUri = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    setIsSystemAction(true);

    await Sharing.shareAsync(newUri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `${safeTitle} PDF 저장`,
    });
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'PDF 생성 중 문제가 발생했어요',
      position: 'top',
      topOffset: 60,
    });
    console.error(error);
    throw error;
  }
};

const fs = require('fs');
const path = require('path');

// 이미지가 있는 곳: 프로젝트 루트의 assets/emotions
const emotionsDir = path.join(__dirname, 'assets', 'emotions');

// 💡 수정된 부분: 파일이 저장될 곳을 src/constants 안으로 지정했습니다.
const outputFile = path.join(__dirname, 'src', 'constants', 'emotionBase64.ts');

const EMOTIONS = [
  'joy',
  'excited',
  'calm',
  'happy',
  'pleasant',
  'hopeful',
  'love',
  'hurt',
  'sad',
  'tired',
  'stressed',
  'angry',
  'annoyed',
  'surprised',
  'exhausted',
  'flustered',
  'cool',
  'teasing',
];

let tsContent = `// 🚨 이 파일은 스크립트에 의해 자동 생성되었습니다. 직접 수정하지 마세요.\n\nexport const EMOTION_BASE64_MAP: Record<string, string> = {\n`;

EMOTIONS.forEach((emotion) => {
  const imagePath = path.join(emotionsDir, `${emotion}.png`);

  if (fs.existsSync(imagePath)) {
    const base64Data = fs.readFileSync(imagePath, { encoding: 'base64' });
    tsContent += `  '${emotion}': 'data:image/png;base64,${base64Data}',\n`;
  } else {
    console.log(
      `⚠️ 경고: ${emotion}.png 파일을 찾을 수 없습니다. 경로를 확인하세요: ${imagePath}`,
    );
  }
});

tsContent += `};\n`;

// 폴더가 없으면 생성 (src/constants 폴더가 있는지 확인)
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`📁 ${outputDir} 폴더를 새로 생성했습니다.`);
}

// 파일 쓰기
fs.writeFileSync(outputFile, tsContent);
console.log(
  '✅ emotionBase64.ts 파일이 src/constants 폴더에 성공적으로 생성되었습니다!',
);

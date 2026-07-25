# ✍️ 동글일기 (Dongle Diary)

동글일기는 사용자의 감정을 기록하고 일상을 관리할 수 있는 다기능 감성 일기장 및 메모 애플리케이션입니다.

## ✨ 핵심 기능 (Features)

- **감정 일기 (Diary):** 다양한 감정(Emotion) 아이콘과 함께 하루를 기록하고 관리합니다.
- **메모장 (Memo):** 폴더별로 메모를 분류하고, 에디터를 통해 텍스트를 작성 및 관리합니다.
- **캘린더 뷰 (Calendar):** 달력 형태로 일기와 메모 기록을 한눈에 모아볼 수 있습니다.
- **강력한 보안 및 백업 (Security & Backup):** 앱 잠금(Lock) 기능과 백업/복원 기능을 지원합니다.
- **커스터마이징 (Customization):** 테마(Theme), 폰트(Font), 언어(Language) 등을 사용자의 취향에 맞게 설정할 수 있습니다.
- **PDF 내보내기 (PDF Export):** 기록한 일기를 오프라인 문서(PDF)로 변환하여 소장할 수 있습니다.

## 🛠 기술 스택 (Tech Stack)

- **Framework:** React Native, Expo
- **Routing:** Expo Router (`src/app` 기반 파일 시스템 라우팅)
- **Language:** TypeScript
- **State Management:** 상태 관리 라이브러리 활용 (`src/store/useDiaryStore`, `useMemoStore`)
- **Styling/UI:** Custom UI Components (Atomic Design Pattern) 및 전역 CSS 적용

## 📂 프로젝트 구조 (Project Structure)

프로젝트는 유지보수성과 확장성을 고려하여 `src` 폴더 내에 기능별로 분리되어 있습니다.

\`\`\`text
src/
 ├── app/               # Expo Router 기반의 화면(Screen) 및 라우팅 디렉토리
 │    ├── diary/        # 일기 관련 화면 ([id].tsx 등)
 │    ├── _layout.tsx   # 앱의 전체 레이아웃
 │    └── *.tsx         # 설정(Settings), 검색(Search), 작성(Write) 등 주요 스크린
 ├── components/        # 재사용 가능한 UI 컴포넌트 (Atomic Design 기반)
 │    ├── atoms/        # 가장 작은 단위의 컴포넌트 (Text, TextInput, Button 등)
 │    ├── common/       # 공통 컴포넌트 (Card, Spinner, Switch 등)
 │    ├── modals/       # 바텀 시트 및 팝업 모달 (Emotion, Calendar, Confirm 등)
 │    ├── sections/     # 화면을 구성하는 큰 단위의 섹션 (List, View 등)
 │    └── ui/           # 복합 UI 컴포넌트 및 아이콘
 ├── constants/         # 전역적으로 사용되는 상수 데이터
 │    ├── emotions.ts / emotionBase64.ts # 감정 아이콘 및 PDF 렌더링용 Base64 데이터
 │    ├── calendar.ts   # 달력 관련 상수
 │    └── theme.ts / font.ts # 스타일 관련 상수
 ├── hooks/             # 커스텀 훅 (use-color-scheme, use-theme 등)
 ├── store/             # 전역 상태 관리 (useDiaryStore, useMemoStore)
 └── global.css         # 전역 스타일시트
\`\`\`

## 🚀 개발 및 실행 방법 (Getting Started)

### 사전 준비
- Node.js 설치
- 패키지 매니저 (`npm` 또는 `yarn`) 설치

### 설치 및 실행
1. 프로젝트 패키지 설치
   \`\`\`bash
   npm install
   \`\`\`

2. 프로젝트 실행
   \`\`\`bash
   npm start
   \`\`\`
   > **💡 참고:** `npm start`를 실행하면 `prestart` 훅을 통해 `generateBase64.js` 스크립트가 먼저 실행되어, PDF 내보내기에 필요한 최신 이미지(Base64) 상수가 `src/constants/emotionBase64.ts`에 자동 갱신됩니다.

## 🖼️ PDF 내보내기용 이미지 자산(Assets) 관리
Android Release 빌드에서 로컬 이미지가 PDF에 정상적으로 렌더링되지 않는 이슈를 방지하기 위해, 앱 내 표정 이미지들은 Base64 문자열로 변환하여 사용하고 있습니다.
- `src/constants/emotionBase64.ts` 파일은 **자동 생성**되므로 직접 수정하지 마세요.
- 이미지를 추가하거나 변경할 경우 원본 폴더(`assets/emotions/`)를 수정 후 앱을 재시작(`npm start`)하면 자동으로 반영됩니다.
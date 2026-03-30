# 레몬헬스케어 AI 영업 코치 (Lemon Sales Coach)
## Claude Code 개발 가이드

---

## 프로젝트 개요

영업 담당자(Kes)가 고객과 나누는 대화를 AI가 함께 정리하고, 다음에 무엇을 해야 이길 수 있는지 가이드하는 B2B 영업 관리 도구.

- 영업은 메모(텍스트 or 음성)만 입력 → AI가 나머지를 정리
- Win/Loss 결과가 쌓일수록 Win 공식이 정교해짐
- 어느 단계(발굴~계약)에서든 딜을 시작 가능
- 음성 업로드 → Whisper STT → Claude 구조화 자동 파이프라인

**MVP 대상:** Kes 단독 (이메일 로그인 단일 계정)
**배포 환경:** Vercel Pro (HTTPS)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Database | Supabase (PostgreSQL 15) + Supabase Storage |
| Auth | Supabase Auth — 이메일/패스워드 |
| Backend Logic | Supabase Edge Functions (Deno) |
| AI 텍스트 | Anthropic Claude Sonnet 4.6 (`claude-sonnet-4-6`) |
| AI 음성→텍스트 | OpenAI Whisper API (`whisper-1`, language: ko) |
| 문서 생성 | 제안서: 마크다운 렌더링 (MVP) |
| 배포 | Vercel Pro |
| 이메일 알림 | Resend API (Phase 2) |

---

## 환경 변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Edge Function 전용

ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...              # Whisper STT용

RESEND_API_KEY=re_...              # 이메일 알림 (Phase 2)
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## 프로젝트 디렉토리 구조

```
lemon-sales-coach/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # 인증 가드 + 사이드바
│   │   ├── page.tsx                # 홈 대시보드
│   │   ├── deals/
│   │   │   ├── page.tsx            # 딜 목록
│   │   │   ├── new/page.tsx        # 딜 생성
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # 딜 상세 + AI 코치
│   │   │       └── proposal/page.tsx
│   │   └── win-formula/page.tsx    # Win 공식 대시보드
│   └── api/
│       ├── analyze-memo/route.ts   # 메모 → Claude 구조화
│       ├── transcribe/route.ts     # 음성 → Whisper → 텍스트
│       ├── coach/route.ts          # AI 코치 (SSE 스트리밍)
│       ├── proposal/route.ts       # 제안서 초안 생성
│       ├── win-patterns/route.ts   # Win 패턴 집계
│       └── today-actions/route.ts  # 오늘 할 일 (AI 우선순위)
├── components/
│   ├── deals/
│   │   ├── DealCard.tsx
│   │   ├── DealKanban.tsx
│   │   ├── DealForm.tsx
│   │   └── StageProgress.tsx
│   ├── memo/
│   │   ├── MemoInput.tsx
│   │   └── AudioUpload.tsx
│   ├── ai/
│   │   ├── CoachPanel.tsx
│   │   └── ContextSnapshot.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── ai/
│   │   ├── claude.ts
│   │   ├── whisper.ts
│   │   └── prompts.ts             # 모든 프롬프트 상수 관리
│   └── utils.ts
├── types/
│   └── index.ts
└── supabase/
    ├── migrations/
    └── functions/
        └── process-audio/
```

---

## 데이터베이스 스키마

### deals
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | 딜 고유 ID |
| user_id | uuid FK | 담당자 (auth.users) |
| hospital_name | text NOT NULL | 병원명 |
| services | text[] | 서비스 목록 (레몬케어 등) |
| stage | text | discovery/proposal/negotiation/confirmed/contract |
| prob_grade | text | 확도 S/A/B/C |
| entry_point | text | 딜 시작 단계 |
| hospital_size | text | 의원/병원/종합병원/상급종합 |
| emr_vendor | text | 유비케어/비트/이지케어텍 등 |
| decision_makers | jsonb | [{name, role, style, contact_pref}] |
| context_snapshot | jsonb | AI 추출 맥락 전체 |
| stage_log | jsonb | [{stage, entered_at, exited_at, days}] |
| prob_history | jsonb | [{date, from, to, trigger}] |
| outcome | text | win / loss / active |
| win_factors | text[] | 계약 성사 요인 |
| loss_reason | text | 드랍 원인 |
| days_in_stage | integer | 현재 단계 체류일 (자동계산) |
| next_action | text | 다음 액션 |
| due_date | timestamptz | 팔로업 기한 |

**context_snapshot 구조:**
```json
{
  "hidden_needs": [],
  "pain_points": [],
  "objections": [],
  "win_signals": [],
  "decision_maker_style": "",
  "contact_preference": "",
  "budget_sensitivity": "",
  "decision_log": [{"date": "", "note": ""}]
}
```

### meeting_logs
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| deal_id | uuid FK | |
| user_id | uuid FK | |
| input_type | text | text / audio |
| raw_text | text | 원문 or Whisper 변환 결과 |
| audio_path | text | Supabase Storage 경로 |
| audio_duration | integer | 녹음 길이(초) |
| ai_summary | text | Claude 요약 (2~3문장) |
| extracted | jsonb | {hidden_needs[], objections[], signals[], next_actions[]} |

### contact_logs
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| deal_id | uuid FK | |
| method | text | 전화/카카오/이메일/방문 |
| initiated_by | text | sales / customer |
| response_speed_hours | numeric | 고객 응답 소요 시간 |
| sentiment | text | positive/neutral/negative/no_response |
| contacted_at | timestamptz | |

### win_patterns (VIEW)
`deals` 테이블에서 자동 집계. `emr_vendor`, `hospital_size`, `services` 기준 Win률 + 평균 계약 소요일.

### RLS 정책
모든 테이블에 `user_id = auth.uid()` 조건 적용. Storage 버킷 경로: `{user_id}/{deal_id}/{timestamp}.{ext}`

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/deals | 딜 목록 (stage 필터, 정렬) |
| POST | /api/deals | 딜 생성 |
| GET | /api/deals/[id] | 딜 상세 (meeting_logs 포함) |
| PATCH | /api/deals/[id] | 딜 수정 (단계 변경, 결과 기록) |
| DELETE | /api/deals/[id] | 딜 삭제 |
| POST | /api/analyze-memo | 텍스트 메모 → Claude 구조화 |
| POST | /api/transcribe | 음성 → Whisper → 텍스트 → Claude |
| POST | /api/coach | 딜 ID → AI 코치 (SSE 스트리밍) |
| POST | /api/proposal | 딜 ID → 제안서 초안 |
| GET | /api/win-patterns | Win 공식 집계 데이터 |
| GET | /api/today-actions | 오늘 할 일 (AI 우선순위) |

### POST /api/transcribe 처리 흐름
1. FormData로 음성 파일 수신 (multipart/form-data)
2. Supabase Storage 업로드: `audio-recordings/{user_id}/{deal_id}/{ts}.{ext}`
3. Whisper API 호출 (`whisper-1`, language: ko)
4. 변환 텍스트를 analyze-memo로 내부 전달
5. meeting_logs 저장 + deals.context_snapshot 업데이트

**지원 파일:** `.mp3`, `.mp4`, `.m4a`, `.wav`, `.webm`, `.ogg` / 최대 25MB

### POST /api/coach 처리 흐름
1. deal + meeting_logs + contact_logs 풀 조회
2. win_patterns 뷰에서 동일 세그먼트(EMR, 규모) 통계 조회
3. Claude API 호출 → SSE 스트리밍 응답

---

## AI 프롬프트 설계 (`lib/ai/prompts.ts`)

### MEMO_ANALYSIS_SYSTEM
메모 → 구조화. JSON 형식만 응답:
```json
{
  "summary": "2~3문장 핵심 요약",
  "extracted": {
    "hidden_needs": [],
    "pain_points": [],
    "objections": [],
    "win_signals": [],
    "next_actions": []
  },
  "context_patch": {
    "contact_preference": "전화선호|카카오|이메일|방문선호",
    "decision_maker_style": "데이터중시|관계중시|빠른결정|신중함",
    "budget_sensitivity": "민감|보통|둔감"
  }
}
```

### COACH_SYSTEM
마크다운 응답 구조:
- `## 이 딜의 Win 가능성` — S/A/B/C 등급 + 근거
- `## 지금 당장 해야 할 것` — 액션 3가지
- `## 유사 Win 패턴` — 동일 EMR/규모 성공 전략
- `## 주의할 것` — 위험 신호
- `## 반론 대응` — 예상 반론과 대응

### PROPOSAL_SYSTEM
제안서 마크다운 구조:
1. 현황 및 과제 (pain_points 기반)
2. 제안 솔루션
3. 기대 효과
4. 도입 절차
5. 레퍼런스 (동일 EMR/규모 사례)

---

## 화면 구성

### 홈 대시보드 (`/`)
- 오늘 할 일 카드 (AI 우선순위 3가지, 기한 초과 빨간색)
- 파이프라인 요약 (단계별 딜 수)
- 위험 신호 목록 (7일 이상 체류 딜)
- Win 공식 미리보기

### 딜 목록 (`/deals`)
- DealCard: 병원명, 서비스, 단계 배지, 확도, 체류일(D+n), 최근 메모 요약
- 정렬: 확도순(S→C), 최근활동순 / 단계별 필터
- 딜 생성 필드: 병원명*, 서비스*(다중), 현재단계*, 병원규모, EMR사, 담당자명/역할

### 딜 상세 (`/deals/[id]`) — 4개 섹션
- **섹션 A** 고객 프로파일 카드 (니즈/반론/신호 태그, 의사결정자 정보)
- **섹션 B** 미팅 메모 입력 (텍스트 탭 + 음성 업로드 탭, 4단계 진행 상태)
- **섹션 C** AI 코치 (스트리밍 응답, 유사 딜 케이스)
- **섹션 D** 액션/문서 (단계 변경, Next Action + Due Date, Win/Loss 기록, 제안서 생성)

### Win 공식 (`/win-formula`)
- EMR별 Win률 바 차트 (Recharts)
- 병원 규모별 평균 계약 소요일 + Win률 테이블
- 최적 연락 패턴 (contact_logs 집계)
- 반론 대응 라이브러리
- 딜 10개 미만 시 "데이터 누적 중" 표시

---

## 타입 정의 (`types/index.ts`)

```typescript
export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'confirmed' | 'contract';
export type ProbGrade = 'S' | 'A' | 'B' | 'C';
export type Outcome = 'win' | 'loss' | 'active';

export interface ContextSnapshot {
  hidden_needs: string[];
  pain_points: string[];
  objections: string[];
  win_signals: string[];
  decision_maker_style?: string;
  contact_preference?: string;
  budget_sensitivity?: string;
  decision_log: Array<{ date: string; note: string }>;
}

export interface Deal {
  id: string;
  hospital_name: string;
  services: string[];
  stage: DealStage;
  prob_grade?: ProbGrade;
  hospital_size?: string;
  emr_vendor?: string;
  context_snapshot: ContextSnapshot;
  outcome?: Outcome;
  days_in_stage: number;
  next_action?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingLog {
  id: string;
  deal_id: string;
  input_type: 'text' | 'audio';
  raw_text?: string;
  audio_path?: string;
  audio_duration?: number;
  ai_summary?: string;
  extracted: {
    hidden_needs: string[];
    pain_points: string[];
    objections: string[];
    win_signals: string[];
    next_actions: string[];
  };
  created_at: string;
}
```

---

## 구현 순서 (14일 계획)

| Day | 모듈 | 구현 내용 | 완료 기준 |
|-----|------|-----------|-----------|
| 1~2 | supabase/migrations/001_init.sql | deals, meeting_logs, contact_logs 테이블 + RLS + Storage 버킷 | Supabase Studio 확인 |
| 3 | app/(auth)/login | Supabase Auth 이메일 로그인 + 리디렉트 | 로그인 → 홈 동작 |
| 4 | app/(dashboard)/deals | 딜 목록 + 생성 폼 + CRUD | 생성→목록→삭제 E2E |
| 5 | lib/ai/claude.ts + analyze-memo | Claude API 래퍼 + 메모 구조화 API | 테스트 메모 → JSON 응답 |
| 6 | components/memo/MemoInput | 텍스트 메모 입력 UI + API 연동 | 메모 → 분석 → 화면 표시 |
| 7 | lib/ai/whisper.ts + transcribe | Whisper 래퍼 + Storage 업로드 | m4a → 텍스트 변환 확인 |
| 8 | components/memo/AudioUpload | 드래그&드롭 UI + 4단계 진행 표시 | 음성 → 변환 → 분석 E2E |
| 9 | app/api/coach | 딜 맥락 + win_patterns → SSE 스트리밍 | 코치 버튼 → 스트리밍 출력 |
| 10 | components/ai/CoachPanel | 스트리밍 렌더링 + react-markdown | 코치 패널 UI 완성 |
| 11 | app/api/proposal + 제안서 페이지 | 제안서 초안 생성 + 마크다운 렌더링 | 제안서 생성 → 표시 |
| 12 | app/(dashboard)/win-formula | win_patterns 집계 + Recharts 차트 | EMR별 차트 표시 |
| 13 | app/(dashboard)/page.tsx | 홈 대시보드 전체 섹션 | 할 일 + 위험 신호 표시 |
| 14 | Vercel 배포 + E2E 테스트 | 환경 변수 등록 + 전체 플로우 검증 | HTTPS URL + E2E 통과 |

---

## MVP 완료 체크리스트

- [ ] Supabase 스키마 마이그레이션 + RLS 적용
- [ ] 로그인 → 홈 리디렉트 동작
- [ ] 딜 생성 → 목록 → 삭제 전체 흐름
- [ ] 텍스트 메모 → Claude 분석 → 결과 표시
- [ ] 음성(.m4a) → Whisper 변환 → Claude 분석 → 결과 표시
- [ ] AI 코치 버튼 → 스트리밍 응답 출력
- [ ] 제안서 초안 생성 → 마크다운 렌더링
- [ ] 단계 변경 → stage_log 업데이트
- [ ] Win/Loss 기록 → win_patterns 뷰 반영
- [ ] Win 공식 화면 → EMR별 차트 표시
- [ ] 홈 화면 → 오늘 할 일 + 위험 신호 딜
- [ ] Vercel 배포 + HTTPS 접속 확인
- [ ] E2E: 딜 생성 → 음성 메모 → AI 코치 → 제안서

---

## MVP 제외 항목 (Phase 2)

- 팀 멀티유저 (영업 6인 공유)
- 견적서 PDF 자동 생성
- 계약서 DOCX 자동 생성
- 연락 이력 관리 + 최적 연락 패턴 분석
- 팔로업 기한 이메일 알림 (Resend)
- 회사 MIS (구글 시트) 자동 연동 브릿지

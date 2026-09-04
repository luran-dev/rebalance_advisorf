# Rebalance Advisor

Google Sheets로 관리하던 포트폴리오 리밸런싱 전략을 로컬 웹 애플리케이션으로 관리하는 프로젝트입니다.

## Requirements

- Node.js 22 이상
- pnpm 10 이상

의존성 설치:

```bash
pnpm install
```

## Development

개발 서버 실행:

```bash
pnpm dev
```

기본 주소:

```text
http://127.0.0.1:5173/
```

개발 서버는 터미널에서 `Ctrl+C`로 종료합니다.

## Build

프로덕션 빌드 생성:

```bash
pnpm build
```

빌드 산출물은 `dist/`에 생성됩니다.

## Start / Stop / Restart

운영 확인용 서버는 `vite preview`로 빌드된 `dist/`를 실행합니다. 시작 시 자동으로 `pnpm build`를 먼저 수행합니다.

시작:

```bash
pnpm app:start
```

중지:

```bash
pnpm app:stop
```

재시작:

```bash
pnpm app:restart
```

상태 확인:

```bash
pnpm app:status
```

기본 주소:

```text
http://127.0.0.1:4173/
```

로그와 PID 파일은 `.run/` 아래에 저장됩니다.

- `.run/rebalance-advisor.log`
- `.run/rebalance-advisor.pid`

포트를 바꿔 실행하려면 `PORT` 환경변수를 사용합니다.

```bash
PORT=4180 pnpm app:start
PORT=4180 pnpm app:status
PORT=4180 pnpm app:stop
```

호스트를 바꾸려면 `HOST` 환경변수를 사용합니다.

```bash
HOST=0.0.0.0 PORT=4173 pnpm app:start
```

## Script

package script 대신 직접 실행할 수도 있습니다.

```bash
./scripts/rebalance-advisor.sh start
./scripts/rebalance-advisor.sh stop
./scripts/rebalance-advisor.sh restart
./scripts/rebalance-advisor.sh status
./scripts/rebalance-advisor.sh build
```

## Data Persistence

입력한 포트폴리오 데이터는 브라우저 `localStorage`에 저장됩니다. 같은 브라우저와 같은 주소에서 앱을 다시 열면 기존 데이터가 유지됩니다.

브라우저 저장값이 사라질 수 있으므로, 중요한 변경 후에는 앱의 데이터 관리 화면에서 JSON 백업을 내보내 두는 것을 권장합니다.

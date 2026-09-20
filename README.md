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
http://localhost:5173/
http://<이 컴퓨터의 IP>:5173/
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
http://localhost:4173/
http://<이 컴퓨터의 IP>:4173/
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

또는 실행 옵션으로 직접 지정할 수 있습니다.

```bash
pnpm app:start -- --port 4180
pnpm app:restart -- --port 4180
pnpm app:stop -- --port 4180
./scripts/rebalance-advisor.sh start --port 4180
./scripts/rebalance-advisor.sh stop --port 4180
```

앱이 실행 중이면 `pnpm app:status`가 시작 당시의 포트를 보여줍니다. `stop --port`는 PID 파일이 없어도 해당 포트에서 실행 중인 서버를 종료할 수 있습니다.

호스트를 바꾸려면 `HOST` 환경변수를 사용합니다.

```bash
HOST=0.0.0.0 PORT=4173 pnpm app:start
```

호스트도 실행 옵션으로 지정할 수 있습니다.

```bash
pnpm app:start -- --host 0.0.0.0 --port 4173
```

## Script

package script 대신 직접 실행할 수도 있습니다.

```bash
./scripts/rebalance-advisor.sh start
./scripts/rebalance-advisor.sh start --port 4180
./scripts/rebalance-advisor.sh stop
./scripts/rebalance-advisor.sh stop --port 4180
./scripts/rebalance-advisor.sh restart
./scripts/rebalance-advisor.sh status
./scripts/rebalance-advisor.sh build
```

## Data Persistence

이메일로 가입하거나 로그인하면 포트폴리오 데이터가 서버의 SQLite DB에 사용자별로 분리 저장됩니다.

기본 DB 파일:

```text
.data/rebalance-advisor.sqlite
```

다른 위치를 사용하려면 서버 시작 전에 `REBALANCE_DB_PATH`를 지정합니다.

```bash
REBALANCE_DB_PATH=/absolute/path/rebalance.sqlite pnpm app:start
```

기존 브라우저 `localStorage` 포트폴리오는 해당 브라우저에서 처음 로그인한 사용자에게 한 번 이전된 뒤 제거됩니다. 환율 등 다시 조회할 수 있는 캐시는 브라우저에 남을 수 있습니다.

중요한 변경 후에는 앱의 데이터 관리 화면에서 JSON 백업도 내보내 두는 것을 권장합니다.

백업 파일명은 분 단위까지 포함합니다.

```text
rebalance-advisor-backup-YYYY-MM-DD-HH-MM.json
```

## Password Reset Email

비밀번호 찾기 이메일은 Resend로 발송합니다. `.env.example`을 참고해 프로젝트 루트의 `.env`에 다음 값을 설정합니다.

```dotenv
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL="Rebalance Advisor <no-reply@example.com>"
```

`RESEND_FROM_EMAIL`에는 Resend에서 인증한 도메인의 발신 주소를 사용해야 합니다. 설정 변경 후 서버를 재시작합니다.

```bash
pnpm app:restart
```

인증 코드는 6자리이며 5분 후 만료됩니다. 5회 실패하면 폐기되고, 비밀번호 변경에 성공하면 기존 로그인 세션이 모두 종료됩니다.

저장 위치 선택을 지원하는 브라우저에서는 백업 내보내기 시 저장 창에서 경로를 고를 수 있습니다. 지원하지 않는 브라우저에서는 기존처럼 브라우저 기본 다운로드 위치에 저장됩니다.

`0.0.0.0`으로 실행한 HTTP 서버의 로그인 정보는 암호화되지 않은 네트워크를 통과합니다. 신뢰할 수 있는 로컬 네트워크에서만 사용하고, 외부 공개 시에는 HTTPS 리버스 프록시를 앞에 두세요.

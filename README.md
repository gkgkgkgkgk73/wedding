# Mobile Wedding Invitation

## 수정할 곳

- `index.html`: 신랑/신부 이름, 부모님 성함, 계좌번호 문구
- `script.js`: 공유 문구, 구글 캘린더 일정, 주소 정보
- `assets/cover.svg`: 표지 이미지. 실제 사진을 쓰려면 `assets/cover.jpg`를 넣고 `index.html`의 이미지 경로를 바꾸면 됩니다.
- `assets/gallery-1.svg` 등: 가로 스크롤 갤러리 이미지. 실제 사진으로 교체할 수 있습니다.
- `assets/map.svg`, `assets/map_naver.png`: 예식장 지도 이미지

## GitHub Pages

저장소 Settings → Pages에서 배포 방식을 선택합니다.

- 간단 배포: Source를 `Deploy from a branch`, Branch를 `main`, Folder를 `/root`로 선택
- Actions 배포: Source를 `GitHub Actions`로 선택하면 `.github/workflows/pages.yml`이 사용됩니다.

## Vercel + DB

참석 여부는 `api/rsvp.js`에서 `Vercel Postgres`로 저장되도록 연결되어 있습니다.

1. Vercel에서 이 GitHub 저장소를 `Import`
2. 프로젝트 대시보드에서 `Storage` → `Create Database` → `Postgres` 생성
3. 생성한 Postgres를 현재 프로젝트에 연결
4. 다시 배포하면 Vercel이 `POSTGRES_URL` 등 필요한 환경변수를 자동으로 넣어줍니다

폼 데이터는 첫 요청 시 아래 테이블에 저장됩니다.

- 테이블명: `rsvps`
- 컬럼: `id`, `side`, `name`, `guest_group`, `count`, `attendance`, `submitted_at`, `created_at`

배포 후 청첩장 페이지에서 `참석여부 전달하기`를 제출하면 `/api/rsvp`를 통해 DB에 저장됩니다.

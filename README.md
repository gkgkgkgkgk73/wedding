# Wedding Invitation

GitHub Pages용 모바일 청첩장입니다.

## 수정할 곳

- `index.html`: 신랑/신부 이름, 예식 일시, 장소, 주소, 계좌번호 문구
- `script.js`: 공유 문구, 구글 캘린더 일정, 주소 정보
- `assets/cover.svg`: 커버 이미지. 실제 사진을 쓰려면 `assets/cover.jpg`를 넣고 `index.html`의 이미지 경로를 바꾸면 됩니다.
- `assets/gallery-1.svg` 등: 갤러리 이미지. 실제 사진으로 교체할 수 있습니다.

## GitHub Pages

저장소 Settings → Pages에서 배포 방식을 선택합니다.

- 간단 배포: Source를 `Deploy from a branch`, Branch를 `main`, Folder를 `/root`로 선택
- Actions 배포: Source를 `GitHub Actions`로 선택하면 `.github/workflows/pages.yml`이 사용됩니다.

const toast = document.querySelector("[data-toast]");
const weddingDate = new Date("2026-08-23T13:00:00+09:00");

const wedding = {
  title: "김준경 & 유경민 결혼합니다",
  dateText: "2026년 8월 23일 일요일 오후 1시",
  place: "서울대학교 연구공원 웨딩홀",
  address: "서울특별시 관악구 관악로 1 (서울특별시 관악구 신림동 산56-1)",
  rsvpEndpoint: "/api/rsvp",
  kakaoJavascriptKey: "0bbcc99e7cbf96ce3794c12d758c14d1"
};

function initializeKakaoMap() {
  const mapElement = document.querySelector("[data-kakao-map]");

  if (!mapElement || !window.kakao?.maps) {
    return;
  }

  window.kakao.maps.load(() => {
    const defaultCenter = new window.kakao.maps.LatLng(37.45897, 126.95134);
    const map = new window.kakao.maps.Map(mapElement, {
      center: defaultCenter,
      level: 4
    });

    const places = new window.kakao.maps.services.Places();

    places.keywordSearch(wedding.place, (result, status) => {
      if (status !== window.kakao.maps.services.Status.OK || !result.length) {
        new window.kakao.maps.Marker({ position: defaultCenter, map });
        return;
      }

      const place = result[0];
      const position = new window.kakao.maps.LatLng(Number(place.y), Number(place.x));
      const marker = new window.kakao.maps.Marker({ position, map });
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:13px;">${wedding.place}</div>`
      });

      map.setCenter(position);
      infoWindow.open(map, marker);
    });
  });
}

function showToast(message) {
  if (!toast) {
    return;
  }

  window.clearTimeout(showToast.timer);
  window.cancelAnimationFrame(showToast.frame);
  toast.classList.remove("is-visible");
  toast.textContent = message;
  showToast.frame = window.requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    showToast("복사하지 못했어요. 길게 눌러 복사해주세요.");
  }
}

function openDialog(dialog) {
  if (!dialog) {
    return;
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (!dialog) {
    return;
  }

  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

document.querySelector("[data-copy-address]")?.addEventListener("click", () => {
  const address = document.querySelector("[data-address]")?.textContent?.trim() || wedding.address;
  copyText(address, "주소를 복사했어요.");
});

document.querySelectorAll("[data-copy-account]").forEach((button) => {
  button.addEventListener("click", () => {
    const account = button.parentElement?.querySelector("[data-account]")?.dataset.account;
    if (account) {
      copyText(account, "계좌번호를 복사했어요.");
    }
  });
});

function initializeKakaoShare() {
  if (!window.Kakao) {
    return false;
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(wedding.kakaoJavascriptKey);
  }

  return true;
}

function shareWithKakao() {
  const imageUrl = new URL("assets/head_ver2.JPG", window.location.href).toString();

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: wedding.title,
      description: `${wedding.dateText} · ${wedding.place}`,
      imageUrl,
      link: {
        mobileWebUrl: window.location.href,
        webUrl: window.location.href
      }
    },
    buttons: [
      {
        title: "청첩장 보기",
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href
        }
      }
    ]
  });
}

document.querySelector("[data-share]")?.addEventListener("click", async () => {
  if (initializeKakaoShare()) {
    try {
      shareWithKakao();
      return;
    } catch {
      showToast("카카오 공유 설정을 확인해주세요.");
    }
  }

  const shareData = {
    title: wedding.title,
    text: `${wedding.dateText} ${wedding.place}`,
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch {
      return;
    }
  }

  copyText(window.location.href, "청첩장 링크를 복사했어요.");
});

const ddayUnits = {
  days: document.querySelector('[data-dday-unit="days"]'),
  hours: document.querySelector('[data-dday-unit="hours"]'),
  minutes: document.querySelector('[data-dday-unit="minutes"]'),
  seconds: document.querySelector('[data-dday-unit="seconds"]')
};

function setDdayUnit(unit, value) {
  const element = ddayUnits[unit];
  if (!element || element.textContent === value) {
    return;
  }

  element.textContent = value;
}

function updateDday() {
  const diff = weddingDate.getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const totalSeconds = Math.floor(absDiff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");

  setDdayUnit("days", String(days));
  setDdayUnit("hours", pad(hours));
  setDdayUnit("minutes", pad(minutes));
  setDdayUnit("seconds", pad(seconds));
}

updateDday();
window.setInterval(updateDday, 1000);
initializeKakaoMap();

const galleryModal = document.querySelector("[data-gallery-modal]");
const galleryBody = document.querySelector("[data-gallery-body]");
const galleryPreview = document.querySelector("[data-gallery-preview]");
const galleryButtons = Array.from(document.querySelectorAll("[data-gallery-src]"));
let currentGalleryIndex = 0;

function renderGalleryImage(index) {
  const button = galleryButtons[index];

  if (!button || !galleryPreview) {
    return;
  }

  const source = button.dataset.gallerySrc || "";
  const thumbnail = button.querySelector("img");

  currentGalleryIndex = index;
  galleryPreview.src = source;
  galleryPreview.alt = thumbnail?.alt || "확대된 웨딩 갤러리 사진";
}

function stepGallery(direction) {
  if (!galleryButtons.length) {
    return;
  }

  const nextIndex = (currentGalleryIndex + direction + galleryButtons.length) % galleryButtons.length;
  renderGalleryImage(nextIndex);
}

galleryButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    renderGalleryImage(index);
    openDialog(galleryModal);
  });
});

galleryModal?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    stepGallery(-1);
  }

  if (event.key === "ArrowRight") {
    stepGallery(1);
  }
});

let touchStartX = 0;
let touchDeltaX = 0;

galleryPreview?.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0]?.clientX || 0;
    touchDeltaX = 0;
  },
  { passive: true }
);

galleryPreview?.addEventListener(
  "touchmove",
  (event) => {
    touchDeltaX = (event.changedTouches[0]?.clientX || 0) - touchStartX;
  },
  { passive: true }
);

galleryPreview?.addEventListener("touchend", () => {
  if (Math.abs(touchDeltaX) < 48) {
    return;
  }

  stepGallery(touchDeltaX > 0 ? -1 : 1);
});

galleryBody?.addEventListener("click", (event) => {
  if (event.target === galleryBody) {
    closeDialog(galleryModal);
  }
});

const rsvpModal = document.querySelector("[data-rsvp-modal]");
const rsvpForm = document.querySelector("[data-rsvp-form]");

document.querySelector("[data-open-rsvp]")?.addEventListener("click", () => {
  openDialog(rsvpModal);
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    closeDialog(button.closest("dialog"));
  });
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeDialog(dialog);
    }
  });
});

async function submitRsvp(payload) {
  const response = await fetch(wedding.rsvpEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("RSVP request failed");
  }

  return response.json();
}

rsvpForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!rsvpForm.reportValidity()) {
    return;
  }

  const formData = new FormData(rsvpForm);
  const payload = {
    side: formData.get("side"),
    name: String(formData.get("name") || "").trim(),
    group: String(formData.get("group") || "").trim(),
    count: Number(formData.get("count") || 1),
    attendance: formData.get("attendance"),
    submittedAt: new Date().toISOString()
  };

  try {
    await submitRsvp(payload);
    showToast("참석여부가 전달됐어요.");
  } catch {
    const pending = JSON.parse(localStorage.getItem("pendingRsvps") || "[]");
    pending.push(payload);
    localStorage.setItem("pendingRsvps", JSON.stringify(pending));
    showToast("임시 저장했어요. API 연결 후 다시 전송할 수 있어요.");
  }

  rsvpForm.reset();
  closeDialog(rsvpModal);
});

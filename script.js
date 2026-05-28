const toast = document.querySelector("[data-toast]");
const weddingDate = new Date("2026-08-23T13:00:00+09:00");

const wedding = {
  title: "김준경 & 유경민 결혼합니다",
  dateText: "2026년 8월 23일 일요일 오후 1시",
  place: "서울대학교 연구공원 웨딩홀",
  address: "서울특별시 관악구 관악로 1 (서울특별시 관악구 신림동 산56-1)",
  rsvpEndpoint: "/api/rsvp"
};

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
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

document.querySelector("[data-share]")?.addEventListener("click", async () => {
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

const ddayModal = document.querySelector("[data-dday-modal]");
const ddayDays = document.querySelector("[data-dday-days]");
const ddayTime = document.querySelector("[data-dday-time]");

function updateDday() {
  if (!ddayDays || !ddayTime) {
    return;
  }

  const diff = weddingDate.getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const totalSeconds = Math.floor(absDiff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");

  ddayDays.textContent = diff >= 0 ? `D-${days}` : `D+${days}`;
  ddayTime.textContent = `${days}일 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

updateDday();
window.setInterval(updateDday, 1000);

document.querySelector("[data-open-dday]")?.addEventListener("click", () => {
  updateDday();
  openDialog(ddayModal);
});

const galleryModal = document.querySelector("[data-gallery-modal]");
const galleryPreview = document.querySelector("[data-gallery-preview]");

document.querySelectorAll("[data-gallery-src]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!galleryPreview) {
      return;
    }

    galleryPreview.src = button.dataset.gallerySrc;
    openDialog(galleryModal);
  });
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

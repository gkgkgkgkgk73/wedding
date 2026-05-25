const toast = document.querySelector("[data-toast]");

const wedding = {
  title: "신랑 이름 · 신부 이름 결혼합니다",
  dateText: "2026년 8월 23일 일요일 오후 1시",
  calendarStart: "20260823T040000Z",
  calendarEnd: "20260823T060000Z",
  place: "서울대학교 연구공원 웨딩홀",
  address: "서울시 관악구 관악로1 서울대학교 연구공원 본관"
};

function showToast(message) {
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

document.querySelector("[data-calendar]")?.addEventListener("click", () => {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: wedding.title,
    dates: `${wedding.calendarStart}/${wedding.calendarEnd}`,
    details: wedding.dateText,
    location: `${wedding.place}, ${wedding.address}`
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noreferrer");
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

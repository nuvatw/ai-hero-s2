/* ------------------------------------------------------
 * n8n 戰鬥營頁面腳本
 *  - 平滑捲動
 *  - 倒數計時（#countdown[data-target]）
 *  - 席次進度條（#status[data-total|data-enrolled]，支援 ?enrolled=XX 覆寫）
 *  - FAQ 單開模式
 * ----------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  // 平滑捲動
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // 倒數
  const cd = document.getElementById("countdown");
  if (cd?.dataset.target) {
    const dd = cd.querySelector(".dd");
    const hh = cd.querySelector(".hh");
    const mm = cd.querySelector(".mm");
    const ss = cd.querySelector(".ss");
    const target = new Date(cd.dataset.target).getTime();
    const tick = () => {
      const now = Date.now();
      let diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
      const m = Math.floor(diff / 60000);    diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      dd.textContent = String(d);
      hh.textContent = String(h).padStart(2, "0");
      mm.textContent = String(m).padStart(2, "0");
      ss.textContent = String(s).padStart(2, "0");
      if (target - now <= 0) {
        cd.textContent = "開幕式進行中";
        clearInterval(timer);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
  }

  // 席次（支援網址參數 ?enrolled=xx）
  const status = document.getElementById("status");
  if (status) {
    const qs = new URLSearchParams(location.search);
    const total = Number(status.dataset.total || 60);
    const enrolledAttr = Number(status.dataset.enrolled || 0);
    const enrolled = qs.has("enrolled") ? Number(qs.get("enrolled")) : enrolledAttr;

    const enrolledEl = document.getElementById("enrolledCount");
    const totalEl = document.getElementById("totalCount");
    const bar = document.getElementById("barFill");

    enrolledEl.textContent = String(Math.max(0, enrolled));
    totalEl.textContent = String(total);
    const pct = Math.min(100, Math.max(0, (enrolled / total) * 100));
    requestAnimationFrame(() => (bar.style.width = pct.toFixed(1) + "%"));
  }

  // FAQ 單開
  document.querySelectorAll(".faq details").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (d.open) {
        document.querySelectorAll(".faq details").forEach((x) => x !== d && (x.open = false));
      }
    });
  });
});

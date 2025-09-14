/**
 * n8n 線上課程頁 JS
 * - 平滑捲動
 * - CTA 保險鏈結
 * - 倒數計時（讀取 #countdown[data-target]）
 * - 席次進度條（讀取 #seats[data-total|data-enrolled]，可用 ?enrolled=XX 覆寫）
 * - FAQ 單開模式
 * - 實體日前 7 天提醒條（#reminder[data-event]）
 * - Footer 線遮罩（沿用）
 * - Timeline：中線一顆球＋當天 100% / 其餘 30%（到邊緣才淡出）
 */
document.addEventListener("DOMContentLoaded", () => {
    /* ===== 平滑捲動 ===== */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id === "#") return;
        if (id && id.startsWith("#")) {
          const el = document.querySelector(id);
          if (!el) return;
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  
    /* ===== 保障所有 CTA 指向正確 ===== */
    document.querySelectorAll(".cta-apply").forEach((btn) => {
      btn.setAttribute("href", "https://tally.so/r/meWY5k");
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener");
    });
  
    /* ===== 倒數計時 ===== */
    const cd = document.getElementById("countdown");
    let cdTimer = null;
    if (cd && cd.dataset.target) {
      const target = new Date(cd.dataset.target).getTime();
      const dd = cd.querySelector(".dd");
      const hh = cd.querySelector(".hh");
      const mm = cd.querySelector(".mm");
      const ss = cd.querySelector(".ss");
  
      const tick = () => {
        const now = Date.now();
        let diff = Math.max(0, target - now);
  
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= d * 24 * 60 * 60 * 1000;
        const h = Math.floor(diff / (1000 * 60 * 60));
        diff -= h * 60 * 60 * 1000;
        const m = Math.floor(diff / (1000 * 60));
        diff -= m * 60 * 1000;
        const s = Math.floor(diff / 1000);
  
        if (dd) dd.textContent = String(d);
        if (hh) hh.textContent = String(h).padStart(2, "0");
        if (mm) mm.textContent = String(m).padStart(2, "0");
        if (ss) ss.textContent = String(s).padStart(2, "0");
  
        if (target - now <= 0) {
          cd.textContent = "開幕式進行中";
          clearInterval(cdTimer);
        }
      };
      tick();
      cdTimer = setInterval(tick, 1000);
    }
  
    /* ===== 席次進度條（可用網址 ?enrolled=XX 覆寫） ===== */
    const seats = document.getElementById("seats");
    if (seats) {
      const qs = new URLSearchParams(location.search);
      const total = Number(seats.dataset.total || 60);
      const enrolledFromAttr = Number(seats.dataset.enrolled || 0);
      const paramKey = seats.dataset.param || "enrolled";
      const enrolled = qs.has(paramKey)
        ? Number(qs.get(paramKey))
        : enrolledFromAttr;
  
      const totalEl = document.getElementById("totalCount");
      const enrolledEl = document.getElementById("enrolledCount");
      const fill = document.getElementById("seatsFill");
  
      if (totalEl) totalEl.textContent = String(total);
      if (enrolledEl) enrolledEl.textContent = String(Math.max(0, enrolled));
      if (fill) {
        const pct = Math.min(100, Math.max(0, (enrolled / total) * 100));
        requestAnimationFrame(() => (fill.style.width = pct.toFixed(1) + "%"));
        fill.setAttribute("aria-valuenow", pct.toFixed(1));
      }
    }
  
    /* ===== FAQ：互斥開合 ===== */
    document.querySelectorAll(".accordion details").forEach((d) => {
      d.addEventListener("toggle", () => {
        if (d.open) {
          document.querySelectorAll(".accordion details").forEach((x) => {
            if (x !== d) x.open = false;
          });
        }
      });
    });
  
    /* ===== 實體日前 7 天提醒條 ===== */
    const rem = document.getElementById("reminder");
    if (rem && rem.dataset.event) {
      const closeBtn = rem.querySelector(".reminder__close");
      const eventTs = new Date(rem.dataset.event).getTime();
      const key = "reminderDismissed:" + rem.dataset.event;
  
      const shouldShow =
        Date.now() >= eventTs - 7 * 24 * 60 * 60 * 1000 && // 一週前
        Date.now() <= eventTs && // 直到活動開始
        localStorage.getItem(key) !== "1";
  
      if (shouldShow) rem.classList.remove("hidden");
      closeBtn?.addEventListener("click", () => {
        rem.classList.add("hidden");
        localStorage.setItem(key, "1");
      });
    }
  
    /* ===== Footer blocker：footer 進入視窗時把固定中線遮住（沿用） ===== */
    const footerEl = document.querySelector("footer");
    const blockerEl = document.querySelector(".footer-blocker");
    function updateFooterBlocker() {
      if (!footerEl || !blockerEl) return;
      const rect = footerEl.getBoundingClientRect();
      const footerInView = rect.top < window.innerHeight;
      blockerEl.style.height = footerInView ? Math.ceil(rect.height) + "px" : "0px";
    }
    updateFooterBlocker();
    window.addEventListener("scroll", updateFooterBlocker, { passive: true });
    window.addEventListener("resize", updateFooterBlocker);
    window.addEventListener("load", updateFooterBlocker);
  
    /* ============================================================
     * Timeline（中線一顆球、當天 100% 其餘 30%，到邊緣才淡出）
     * HTML：
     * <div id="timeline" class="tl" data-current="8">
     *   <div class="tl__ball"></div>
     *   <article class="tl__item" data-day="1">...</article>
     *   ...
     * </div>
     * 若網址含 ?day=8 會覆寫 data-current。
     * ============================================================ */
    const tl = document.getElementById("timeline");
    if (tl) {
      const items = Array.from(tl.querySelectorAll(".tl__item"));
      // 初始：定位到 current day
      const qs = new URLSearchParams(location.search);
      const currentDay =
        Number(qs.get("day") || tl.getAttribute("data-current") || 1) || 1;
      const currentEl = tl.querySelector(`.tl__item[data-day="${currentDay}"]`);
      if (currentEl) {
        setTimeout(() => {
          currentEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      }
  
      const fadePx = 160; // 到邊緣才從 100% 線性淡出到 30%
      let ticking = false;
  
      const compute = () => {
        const centerY = window.innerHeight / 2;
        let bestIdx = -1;
        let bestDist = Infinity;
  
        items.forEach((it, idx) => {
          const r = it.getBoundingClientRect();
          const top = r.top;
          const bottom = r.bottom;
  
          let op = 1;
  
          if (centerY < top) {
            // 還沒進入：由上方邊框開始升到 100%
            const t = Math.max(0, Math.min(1, 1 - (top - centerY) / fadePx));
            op = 0.3 + 0.7 * t;
          } else if (centerY > bottom) {
            // 已經離開：由下方邊框開始降到 30%
            const t = Math.max(0, Math.min(1, 1 - (centerY - bottom) / fadePx));
            op = 0.3 + 0.7 * t;
          } else {
            // 內部：滿格 100%
            op = 1;
          }
  
          it.style.setProperty("--op", op.toFixed(3));
  
          const dist = Math.max(0, Math.max(top - centerY, centerY - bottom));
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
  
        items.forEach((it, idx) =>
          it.classList.toggle("is-current", idx === bestIdx)
        );
        ticking = false;
      };
  
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(compute);
        }
      };
      compute();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }
  });
  
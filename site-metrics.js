(() => {
  const VIEW_KEY = "codexTraining.viewStats";
  const INQUIRY_KEY = "codexTraining.inquiries";

  const load = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  };

  const save = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const pageName = () => {
    const file = window.location.pathname.split("/").pop();
    return file || "index.html";
  };

  const pageTitle = () => {
    const heading = document.querySelector("h1");
    return heading ? heading.textContent.trim() : document.title;
  };

  const recordView = () => {
    const page = pageName();
    if (page === "admin.html") {
      return;
    }

    const stats = load(VIEW_KEY, { total: 0, pages: {}, history: [] });
    const now = new Date().toISOString();
    const current = stats.pages[page] || { title: pageTitle(), count: 0, lastViewedAt: null };

    current.title = pageTitle();
    current.count += 1;
    current.lastViewedAt = now;

    stats.total += 1;
    stats.pages[page] = current;
    stats.history.unshift({ page, title: current.title, viewedAt: now });
    stats.history = stats.history.slice(0, 500);

    save(VIEW_KEY, stats);
  };

  const recordInquiry = (form) => {
    const data = {};
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      data[key] = String(value).trim();
    }

    const inquiries = load(INQUIRY_KEY, []);
    inquiries.unshift({
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      page: pageName(),
      fields: data,
      status: "new",
    });

    save(INQUIRY_KEY, inquiries.slice(0, 200));
  };

  const bindContactForm = () => {
    const form = document.querySelector(".contact-form");
    if (!form) {
      return;
    }

    form.addEventListener("submit", () => {
      recordInquiry(form);
      const status = form.querySelector("[data-form-status]");
      if (status) {
        status.textContent = "問い合わせ内容を管理画面に保存しました。";
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    recordView();
    bindContactForm();
  });
})();

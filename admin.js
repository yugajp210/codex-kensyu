(() => {
  const PASSWORD = "admin2026";
  const SESSION_KEY = "codexTraining.adminSession";
  const VIEW_KEY = "codexTraining.viewStats";
  const INQUIRY_KEY = "codexTraining.inquiries";

  const $ = (selector) => document.querySelector(selector);

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

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    return new Intl.DateTimeFormat("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  const isToday = (value) => {
    const date = new Date(value);
    const today = new Date();
    return date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  };

  const setAuthenticated = (value) => {
    save(SESSION_KEY, { authenticated: value, updatedAt: new Date().toISOString() });
  };

  const isAuthenticated = () => {
    const session = load(SESSION_KEY, {});
    return session.authenticated === true;
  };

  const showDashboard = () => {
    $("[data-admin-login]").hidden = true;
    $("[data-admin-dashboard]").hidden = false;
    renderDashboard();
  };

  const showLogin = () => {
    $("[data-admin-login]").hidden = false;
    $("[data-admin-dashboard]").hidden = true;
  };

  const renderDashboard = () => {
    const stats = load(VIEW_KEY, { total: 0, pages: {}, history: [] });
    const inquiries = load(INQUIRY_KEY, []);
    const todayViews = (stats.history || []).filter((item) => isToday(item.viewedAt)).length;

    $("[data-total-views]").textContent = stats.total || 0;
    $("[data-today-views]").textContent = todayViews;
    $("[data-inquiry-count]").textContent = inquiries.length;

    const pages = Object.entries(stats.pages || {})
      .map(([page, data]) => ({ page, ...data }))
      .sort((a, b) => b.count - a.count);

    $("[data-page-views]").innerHTML = pages.length
      ? pages.map((item) => `
          <tr>
            <td>${escapeHtml(item.title || item.page)}</td>
            <td>${escapeHtml(item.page)}</td>
            <td>${item.count}</td>
            <td>${formatDate(item.lastViewedAt)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4">まだ閲覧データがありません。</td></tr>`;

    $("[data-inquiries]").innerHTML = inquiries.length
      ? inquiries.map((item) => {
          const fields = item.fields || {};
          return `
            <article class="admin-inquiry">
              <header>
                <strong>${escapeHtml(fields["会社名"] || "会社名未入力")}</strong>
                <span>${formatDate(item.createdAt)}</span>
              </header>
              <dl>
                <div><dt>お名前</dt><dd>${escapeHtml(fields["お名前"])}</dd></div>
                <div><dt>メール</dt><dd>${escapeHtml(fields["メールアドレス"])}</dd></div>
                <div><dt>希望コース</dt><dd>${escapeHtml(fields["希望コース"])}</dd></div>
                <div><dt>人数</dt><dd>${escapeHtml(fields["受講予定人数"] || "-")}</dd></div>
                <div><dt>希望時期</dt><dd>${escapeHtml(fields["希望時期"] || "-")}</dd></div>
              </dl>
              <p>${escapeHtml(fields["相談内容"])}</p>
            </article>
          `;
        }).join("")
      : `<p class="admin-empty">まだ問い合わせはありません。</p>`;
  };

  const exportCsv = () => {
    const inquiries = load(INQUIRY_KEY, []);
    const headers = ["日時", "会社名", "お名前", "メールアドレス", "希望コース", "受講予定人数", "希望時期", "相談内容"];
    const rows = inquiries.map((item) => {
      const fields = item.fields || {};
      return [
        item.createdAt,
        fields["会社名"],
        fields["お名前"],
        fields["メールアドレス"],
        fields["希望コース"],
        fields["受講予定人数"],
        fields["希望時期"],
        fields["相談内容"],
      ];
    });
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codex-inquiries-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = $("[data-admin-login-form]");
    const password = $("#admin-password");
    const error = $("[data-admin-error]");

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (password.value === PASSWORD) {
        setAuthenticated(true);
        password.value = "";
        error.textContent = "";
        showDashboard();
        return;
      }

      error.textContent = "パスワードが違います。";
    });

    $("[data-admin-logout]").addEventListener("click", () => {
      setAuthenticated(false);
      showLogin();
    });

    $("[data-admin-refresh]").addEventListener("click", renderDashboard);
    $("[data-admin-export]").addEventListener("click", exportCsv);

    $("[data-admin-clear-inquiries]").addEventListener("click", () => {
      if (confirm("問い合わせ一覧を削除しますか？")) {
        save(INQUIRY_KEY, []);
        renderDashboard();
      }
    });

    $("[data-admin-clear-views]").addEventListener("click", () => {
      if (confirm("閲覧数をリセットしますか？")) {
        save(VIEW_KEY, { total: 0, pages: {}, history: [] });
        renderDashboard();
      }
    });

    if (isAuthenticated()) {
      showDashboard();
    } else {
      showLogin();
    }
  });
})();

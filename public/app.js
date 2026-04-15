(() => {
  const app = document.getElementById("app");
  const page = document.body.dataset.page || "login";
  const STORAGE_KEY = "pulsechat_token";
  const ADMIN_STORAGE_KEY = "pulsechat_admin_token";
  const THEME_STORAGE_KEY = "pulsechat_theme";
  const BRAND_DEFAULT = "Cliffs";
  const routes = {
    landing: "/index.html",
    login: "/login.html",
    dashboard: "/dashboard.html",
    chats: "/chats.html",
    chat: "/chat.html",
    groups: "/groups.html",
    group: "/group.html",
    announcements: "/announcements.html",
    schedule: "/schedule.html",
    materials: "/materials.html",
    material: "/material.html",
    attendance: "/attendance.html",
    search: "/search.html",
    profile: "/profile.html",
    ai: "/ai.html",
    admin: "/admin",
    adminLanding: "/admin-landing.html",
    adminUsers: "/admin-users.html",
    adminGroups: "/admin-groups.html",
    adminContent: "/admin-content.html",
    adminAttendance: "/admin-attendance.html",
    adminFinance: "/admin-finance.html",
  };
  const protectedPages = new Set(["dashboard", "chats", "chat", "groups", "group", "announcements", "schedule", "materials", "material", "attendance", "search", "profile", "ai"]);
  const adminPages = new Set(["admin", "admin-landing", "admin-users", "admin-groups", "admin-content", "admin-attendance", "admin-finance"]);
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  const state = {
    token: localStorage.getItem(STORAGE_KEY) || "",
    adminToken: sessionStorage.getItem(ADMIN_STORAGE_KEY) || "",
    theme: localStorage.getItem(THEME_STORAGE_KEY) || "",
    site: null,
    me: null,
    pollTimer: 0,
    callTimer: 0,
  };

  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path></svg>',
    chats: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M6 10h12M6 14h7"></path><rect x="3" y="4" width="18" height="15" rx="4"></rect></svg>',
    groups: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M16 18v-1a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v1"></path><circle cx="10" cy="8" r="3"></circle><path d="M20 18v-1a3 3 0 0 0-2.2-2.87"></path><path d="M15.2 5.14a3 3 0 0 1 0 5.72"></path></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="4" y="5" width="16" height="14" rx="4"></rect><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><path d="M8 16h8"></path><path d="M12 5V3"></path></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M15 17H5l2-2v-4a5 5 0 1 1 10 0v4l2 2h-4"></path><path d="M10 20a2 2 0 0 0 4 0"></path></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M16 3v4M8 3v4M3 10h18"></path></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v19H6.5A2.5 2.5 0 0 1 4 18.5V4.5A2.5 2.5 0 0 1 6.5 2Z"></path></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path></svg>',
    attendance: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M8 2v4M16 2v4M3 9h18"></path><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="m9 15 2 2 4-4"></path></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="3"></rect><path d="M2 10h20"></path><circle cx="12" cy="12" r="2.2"></circle></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"></path></svg>',
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M20 21a8 8 0 1 0-16 0"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    admin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 3 4 7v5c0 5 3.4 8.1 8 9 4.6-.9 8-4 8-9V7l-8-4Z"></path><path d="m9.5 12 1.7 1.7 3.8-4.2"></path></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4Z"></path></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"></rect><circle cx="9" cy="10" r="2"></circle><path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L7 19"></path></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="m15 18-6-6 6-6"></path></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="6" width="13" height="12" rx="3"></rect><path d="m16 10 5-3v10l-5-3"></path></svg>',
    videoOff: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="3" y="6" width="13" height="12" rx="3"></rect><path d="m16 10 5-3v10l-5-3"></path><path d="M4 4 20 20"></path></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 16a4 4 0 0 0 4-4V7a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4Z"></path><path d="M19 11a7 7 0 0 1-14 0"></path><path d="M12 18v3"></path></svg>',
    micOff: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 16a4 4 0 0 0 4-4V9"></path><path d="M8 8v4a4 4 0 0 0 6.8 2.8"></path><path d="M19 11a7 7 0 0 1-11.2 5.6"></path><path d="M12 18v3"></path><path d="M4 4 20 20"></path></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
  };

  function isProtectedPage() {
    return protectedPages.has(page);
  }

  function isAdminPage() {
    return adminPages.has(page);
  }

  function clearPolling() {
    window.clearInterval(state.pollTimer);
    state.pollTimer = 0;
    window.clearInterval(state.callTimer);
    state.callTimer = 0;
  }

  function setToken(token) {
    state.token = token;
    localStorage.setItem(STORAGE_KEY, token);
  }

  function clearToken() {
    state.token = "";
    localStorage.removeItem(STORAGE_KEY);
  }

  function setAdminToken(token) {
    state.adminToken = token;
    sessionStorage.setItem(ADMIN_STORAGE_KEY, token);
  }

  function clearAdminToken() {
    state.adminToken = "";
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }

  function resolvedTheme() {
    if (state.theme === "dark" || state.theme === "light") return state.theme;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(value) {
    const theme = value === "dark" ? "dark" : "light";
    state.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }

  function themeButton() {
    const dark = resolvedTheme() === "dark";
    return `<button class="icon-button" data-theme-toggle aria-label="Mavzu almashtirish" title="Mavzu almashtirish">${dark ? icons.sun : icons.moon}</button>`;
  }

  function bindThemeToggle() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.onclick = () => {
        applyTheme(resolvedTheme() === "dark" ? "light" : "dark");
        button.innerHTML = resolvedTheme() === "dark" ? icons.sun : icons.moon;
      };
    });
  }

  function brandName() {
    return state.site?.brandName || BRAND_DEFAULT;
  }

  function updateFavicon(url) {
    const href = String(url || "").trim();
    if (!href) return;
    let node = document.querySelector("link[rel='icon']");
    if (!node) {
      node = document.createElement("link");
      node.setAttribute("rel", "icon");
      document.head.appendChild(node);
    }
    node.setAttribute("href", href);
  }

  function applyBrandMeta() {
    document.title = `${brandName()} | O'quv markazi`;
    updateFavicon(state.site?.faviconUrl || "");
  }

  async function loadSiteContent() {
    if (state.site) return state.site;
    try {
      const data = await api("/api/public/site-content");
      state.site = data.site || null;
    } catch {
      state.site = null;
    }
    applyBrandMeta();
    return state.site;
  }

  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function nl2br(value) {
    return escapeHtml(value).replace(/\n/g, "<br>");
  }

  function initials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    return (parts.map((part) => part[0]).join("") || "PC").toUpperCase();
  }

  function formatTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "short",
    }).format(new Date(value));
  }

  function formatMoney(value) {
    const amount = Number(value || 0);
    return `${new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(amount)} so'm`;
  }

  function paymentStatusLabel(status) {
    const map = {
      paid: "To'langan",
      partial: "Qisman",
      unpaid: "To'lanmagan",
      not_set: "Reja yo'q",
    };
    return map[String(status || "").toLowerCase()] || "Noma'lum";
  }

  function paymentStatusClass(status) {
    const key = String(status || "").toLowerCase();
    if (key === "paid") return "ok";
    if (key === "partial") return "warn";
    if (key === "unpaid") return "danger";
    return "muted";
  }

  function avatar(name, src, className = "avatar") {
    if (src) {
      return `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(name || "avatar")}">`;
    }
    return `<div class="${className} avatar-fallback">${escapeHtml(initials(name))}</div>`;
  }

  function icon(name) {
    return `<span class="nav-icon">${icons[name] || ""}</span>`;
  }

  function toast(message, type = "") {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = message;
    node.className = `toast show ${type}`.trim();
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => {
      node.className = "toast";
    }, 2800);
  }

  async function api(url, options = {}) {
    const headers = new Headers(options.headers || {});
    let payload = options.body;
    const adminCapable =
      url.startsWith("/api/admin/") ||
      url === "/api/upload" ||
      url === "/api/upload/" ||
      url.startsWith("/api/upload?");

    if (payload && typeof payload === "object" && !(payload instanceof FormData) && !(payload instanceof Blob)) {
      headers.set("Content-Type", "application/json");
      payload = JSON.stringify(payload);
    }

    if (state.token) {
      headers.set("Authorization", `Bearer ${state.token}`);
    }
    if (adminCapable && state.adminToken) {
      headers.set("X-Admin-Token", state.adminToken);
    }

    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: payload,
    });

    const raw = await response.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      data = { error: raw || "Server javobi noto'g'ri" };
    }

    if (response.status === 401 && adminCapable) {
      clearAdminToken();
      throw new Error(data.error || "Admin sessiya tugagan");
    }

    if (response.status === 401 && isProtectedPage()) {
      clearToken();
      window.location.replace(routes.login);
      throw new Error(data.error || "Sessiya tugagan");
    }

    if (!response.ok) {
      throw new Error(data.error || "Server xatosi");
    }

    return data;
  }

  async function loadMe() {
    if (!state.token) return null;
    const data = await api("/api/me");
    state.me = data.user;
    return data;
  }

  function quickChip(value, label) {
    return `<div class="quick-chip"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  function emptyState(title, subtitle, action = "") {
    return `
      <div class="empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(subtitle)}</p>
        ${action}
      </div>
    `;
  }

  function actionButton(iconName, href, label, extraClass = "icon-button") {
    return `<a class="${extraClass}" href="${href}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${icons[iconName]}</a>`;
  }

  function profileHref(userId = "") {
    return userId ? `${routes.profile}?id=${encodeURIComponent(userId)}` : routes.profile;
  }

  function materialHref(materialId = "") {
    return materialId ? `${routes.material}?id=${encodeURIComponent(materialId)}` : routes.materials;
  }

  function profileAction(user, label = "Profil", extraClass = "icon-button") {
    if (!user || !user.id) return "";
    return actionButton("profile", profileHref(user.id), label, extraClass);
  }

  function profileInline(user, className = "profile-inline") {
    if (!user || !user.id) return "";
    return `
      <a class="${className}" href="${profileHref(user.id)}" aria-label="${escapeHtml(user.fullName || "Profil")}">
        ${avatar(user.fullName, user.avatar, "avatar small")}
        <span>${escapeHtml(user.fullName || user.username || "Profil")}</span>
      </a>
    `;
  }

  function profileButton() {
    if (!state.me) return "";
    return `<a class="avatar-button" href="${profileHref(state.me.id)}" aria-label="Profil">${avatar(state.me.fullName, state.me.avatar, "avatar small")}</a>`;
  }

  function navItem(name, label, target, active) {
    return `
      <a class="${active ? "active" : ""}" href="${target}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
        ${icon(name)}
        <span class="nav-label">${escapeHtml(label)}</span>
      </a>
    `;
  }

  function renderBottomNav() {
    if (!isProtectedPage() || page === "chat" || page === "group") return "";
    return `
      <nav class="bottom-nav">
        ${navItem("home", "Dashboard", routes.dashboard, page === "dashboard")}
        ${navItem("chats", "Chatlar", routes.chats, page === "chats" || page === "chat")}
        ${navItem("groups", "Guruhlar", routes.groups, page === "groups" || page === "group")}
        ${navItem("ai", "AI Ustoz", routes.ai, page === "ai")}
        ${navItem("profile", "Profil", routes.profile, page === "profile")}
      </nav>
    `;
  }

  function renderPage({ title, subtitle = "", actions = "", stats = "", content = "", wide = false, chatMode = false }) {
    app.innerHTML = `
      <main class="page-shell ${wide ? "wide" : ""} ${chatMode ? "chat-mode" : ""}">
        <header class="page-header">
          <div class="page-heading">
            <p class="kicker">${escapeHtml((state.site?.brandTagline || brandName()).toUpperCase())}</p>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="page-subtitle">${escapeHtml(subtitle)}</p>` : ""}
          </div>
          <div class="page-actions">${themeButton()}${actions}</div>
        </header>
        ${stats ? `<section class="quick-strip">${stats}</section>` : ""}
        ${content}
      </main>
      ${renderBottomNav()}
      <div id="toast" class="toast"></div>
    `;
    bindThemeToggle();
  }

  function renderAuthLayout({ title, subtitle, formTitle, formSubtitle, formContent }) {
    app.innerHTML = `
      <main class="auth-shell">
        <section class="panel auth-showcase">
          <span class="brand-pill">${escapeHtml(brandName())} o'quv markazi</span>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(subtitle)}</p>
          <div class="preview-phone stack">
            <div class="preview-row"><strong>1.</strong><span>Admin foydalanuvchi va guruhlarni boshqaradi.</span></div>
            <div class="preview-row"><strong>2.</strong><span>O'qituvchi guruh bo'yicha davomat kiritadi.</span></div>
            <div class="preview-row"><strong>3.</strong><span>Abituriyentlar o'z davomatini va dars chatini ko'radi.</span></div>
          </div>
        </section>
        <section class="panel auth-panel">
          <div class="page-actions auth-actions">${themeButton()}</div>
          <p class="kicker">${escapeHtml(formTitle)}</p>
          <h1>${escapeHtml(formTitle)}</h1>
          <p>${escapeHtml(formSubtitle)}</p>
          ${formContent}
        </section>
      </main>
      <div id="toast" class="toast"></div>
    `;
    bindThemeToggle();
  }

  function conversationHref(chat) {
    return chat.type === "group" ? `${routes.group}?id=${chat.id}` : `${routes.chat}?id=${chat.id}`;
  }

  function conversationItem(chat) {
    const secondary = chat.type === "group" ? `${chat.memberCount} a'zo` : chat.subtitle || "Direct chat";
    const preview = `${chat.lastSenderName ? `${chat.lastSenderName}: ` : ""}${chat.lastMessagePreview || "Suhbatni boshlang"}`;
    const profileTarget = chat.type === "direct" ? chat.user : chat.teacher;
    return `
      <article class="conversation-item">
        <a class="conversation-main conversation-link" href="${conversationHref(chat)}">
          ${avatar(chat.name, chat.avatar, "avatar large")}
          <div class="conversation-copy">
            <div class="conversation-top">
              <p class="conversation-name">${escapeHtml(chat.name)}</p>
              <span class="time-tag">${escapeHtml(formatTime(chat.lastMessageAt || chat.updatedAt))}</span>
            </div>
            <p class="conversation-preview">${escapeHtml(preview)}</p>
            <p class="conversation-preview">${escapeHtml(secondary)}</p>
            ${
              chat.type === "group" && chat.teacher
                ? `<p class="conversation-preview">Ustoz: ${escapeHtml(chat.teacher.fullName)}</p>`
                : ""
            }
          </div>
        </a>
        <div class="page-actions">
          ${profileAction(profileTarget, "Profil")}
        </div>
      </article>
    `;
  }

  function userResult(user) {
    return `
      <article class="result-item">
        <a class="result-main result-link" href="${profileHref(user.id)}">
          ${avatar(user.fullName, user.avatar, "avatar large")}
          <div class="result-copy">
            <div class="result-top">
              <p class="result-name">${escapeHtml(user.fullName)}</p>
              <span class="subtle-tag">@${escapeHtml(user.username)}</span>
            </div>
            <p class="result-preview">${escapeHtml(user.bio || user.phone || "Yangi suhbat uchun tayyor")}</p>
          </div>
        </a>
        <div class="page-actions">
          ${profileAction(user, "Profil")}
          <button class="button secondary icon-only" data-start-chat="${user.id}" aria-label="Yozish" title="Yozish">${icons.chats}<span>Yozish</span></button>
        </div>
      </article>
    `;
  }

  function groupResult(group) {
    return `
      <article class="result-item">
        <a class="result-main result-link" href="${routes.group}?id=${group.id}">
          ${avatar(group.name, group.avatar, "avatar large")}
          <div class="result-copy">
            <div class="result-top">
              <p class="result-name">${escapeHtml(group.name)}</p>
              <span class="subtle-tag">${escapeHtml(formatDate(group.updatedAt))}</span>
            </div>
            <p class="result-preview">${escapeHtml(group.description || "Guruh suhbati")}</p>
            ${
              group.teacher
                ? `<p class="result-preview">Ustoz: ${escapeHtml(group.teacher.fullName)}</p>`
                : ""
            }
          </div>
        </a>
        <div class="page-actions">
          ${profileAction(group.teacher, "Ustoz profili")}
        </div>
      </article>
    `;
  }

  function messageItem(message, chatType) {
    const mine = state.me && message.sender && message.sender.id === state.me.id;
    const senderAvatar = message.sender?.id
      ? `<a class="message-avatar-link" href="${profileHref(message.sender.id)}">${avatar(message.sender?.fullName || "User", message.sender?.avatar, "avatar small")}</a>`
      : avatar(message.sender?.fullName || "User", message.sender?.avatar, "avatar small");
    return `
      <div class="message-row ${mine ? "mine" : ""}">
        ${mine ? "" : senderAvatar}
        <article class="message-bubble">
          ${
            chatType === "group" && !mine
              ? message.sender?.id
                ? `<p class="message-author"><a class="inline-link" href="${profileHref(message.sender.id)}">${escapeHtml(message.sender?.fullName || "A'zo")}</a></p>`
                : `<p class="message-author">${escapeHtml(message.sender?.fullName || "A'zo")}</p>`
              : ""
          }
          ${message.mediaUrl ? `<img class="message-media" src="${escapeHtml(message.mediaUrl)}" alt="media">` : ""}
          ${message.text ? `<p class="message-text">${nl2br(message.text)}</p>` : ""}
          <span class="message-time">${escapeHtml(formatTime(message.createdAt))}</span>
        </article>
      </div>
    `;
  }

  async function uploadFile(file, folder, useAdminEndpoint = false) {
    if (!file) return null;
    if (file.size > 8 * 1024 * 1024) {
      throw new Error("Rasm 8MB dan kichik bo'lsin");
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
      reader.readAsDataURL(file);
    });
    const endpoint = useAdminEndpoint ? "/api/admin/upload" : "/api/upload";
    return api(endpoint, {
      method: "POST",
      body: { dataUrl, folder },
    });
  }

  async function startDirectChat(userId) {
    const data = await api("/api/chats/direct", {
      method: "POST",
      body: { userId },
    });
    window.location.href = `${routes.chat}?id=${data.chat.id}`;
  }

  function attachStartChatHandlers() {
    document.querySelectorAll("[data-start-chat]").forEach((button) => {
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await startDirectChat(button.dataset.startChat);
        } catch (error) {
          button.disabled = false;
          toast(error.message, "error");
        }
      });
    });
  }

  function syncTextareaHeight(textarea) {
    textarea.style.height = "54px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }

  function roleLabel(role) {
    const map = {
      admin: "Administrator",
      teacher: "O'qituvchi",
      abituriyent: "Abituriyent",
    };
    return map[String(role || "").toLowerCase()] || (role || "Foydalanuvchi");
  }

  function isRole(user, ...roles) {
    return roles.includes(String(user?.role || "").toLowerCase());
  }

  function weekdayLabel(day) {
    const labels = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    return labels[Number(day)] || "Kun";
  }

  function materialTypeLabel(type) {
    const map = {
      material: "Material",
      homework: "Vazifa",
      lesson: "Dars qaydi",
    };
    return map[String(type || "").toLowerCase()] || "Yozuv";
  }

  function announcementCard(item, showGroup = false) {
    return `
      <article class="mini-card ${item.pinned ? "is-pinned" : ""}">
        <div class="mini-card-top">
          <p class="mini-card-title">${escapeHtml(item.title)}</p>
          <span class="mini-badge">${item.pinned ? "Muhim" : "E'lon"}</span>
        </div>
        <p class="mini-card-copy">${escapeHtml(item.body)}</p>
        <div class="mini-card-meta">
          <span>${escapeHtml(item.authorName || "Admin")}</span>
          ${showGroup && item.group ? `<span>${escapeHtml(item.group.name)}</span>` : ""}
          <span>${escapeHtml(formatDate(item.createdAt))}</span>
        </div>
      </article>
    `;
  }

  function scheduleCard(item, showGroup = false) {
    return `
      <article class="mini-card">
        <div class="mini-card-top">
          <p class="mini-card-title">${escapeHtml(item.group?.subject || item.group?.name || "Dars")}</p>
          <span class="mini-badge">${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)}</span>
        </div>
        <p class="mini-card-copy">${escapeHtml(weekdayLabel(item.dayOfWeek))}${item.room ? ` • ${escapeHtml(item.room)}` : ""}</p>
        <div class="mini-card-meta">
          ${showGroup && item.group ? `<span>${escapeHtml(item.group.name)}</span>` : ""}
          ${item.note ? `<span>${escapeHtml(item.note)}</span>` : ""}
        </div>
      </article>
    `;
  }

  function materialCard(item, showGroup = false) {
    return `
      <article class="mini-card">
        <div class="mini-card-top">
          <p class="mini-card-title">${escapeHtml(item.title)}</p>
          <span class="mini-badge">${escapeHtml(materialTypeLabel(item.type))}</span>
        </div>
        <p class="mini-card-copy">${escapeHtml(item.description)}</p>
        <div class="mini-card-meta">
          <span>${escapeHtml(item.authorName || "Admin")}</span>
          ${showGroup && item.group ? `<span>${escapeHtml(item.group.name)}</span>` : ""}
          ${item.dueDate ? `<span>Deadline: ${escapeHtml(item.dueDate)}</span>` : `<span>${escapeHtml(formatDate(item.createdAt))}</span>`}
        </div>
        <div class="page-actions">
          <a class="button secondary" href="${materialHref(item.id)}">Batafsil</a>
          ${item.link ? `<a class="button secondary" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Havola</a>` : ""}
        </div>
      </article>
    `;
  }

  function miniCardList(items, renderItem, emptyTitle, emptySubtitle) {
    return items.length ? `<div class="mini-card-list">${items.map(renderItem).join("")}</div>` : emptyState(emptyTitle, emptySubtitle);
  }

  function moduleTile(iconName, href, title, subtitle) {
    return `
      <a class="module-tile" href="${href}">
        <span class="module-icon">${icons[iconName] || ""}</span>
        <div>
          <p class="module-title">${escapeHtml(title)}</p>
          <p class="module-subtitle">${escapeHtml(subtitle)}</p>
        </div>
      </a>
    `;
  }

  function attendanceHistoryCard(item) {
    const myStatus = item.myStatus ? (item.myStatus.present ? "Bor" : "Yo'q") : "";
    return `
      <article class="mini-card attendance-card">
        <div class="mini-card-top">
          <p class="mini-card-title">${escapeHtml(item.group?.name || "Guruh")} • ${escapeHtml(item.date)}</p>
          <span class="mini-badge">${escapeHtml(String(item.presentCount || 0))} / ${escapeHtml(String(item.absentCount || 0))}</span>
        </div>
        <p class="mini-card-copy">${escapeHtml(item.lessonTopic || item.lessonNote || "Mavzu ko'rsatilmagan")}</p>
        <div class="mini-card-meta">
          ${item.homework ? `<span>Vazifa: ${escapeHtml(item.homework)}</span>` : ""}
          ${myStatus ? `<span>Mening holatim: ${escapeHtml(myStatus)}</span>` : ""}
        </div>
        <details class="toggle-panel">
          <summary>To'liq ro'yxat <span class="toggle-count">${escapeHtml(String((item.records || []).length))} ta</span></summary>
          <div class="toggle-body">
            <div class="member-list">
              ${(item.records || [])
                .map(
                  (row) => `
                    <div class="member-option">
                      ${avatar(row.student?.fullName || "Talaba", row.student?.avatar, "avatar small")}
                      <span>${escapeHtml(row.student?.fullName || "Talaba")} - ${row.present ? "Bor" : "Yo'q"}${row.note ? ` (${escapeHtml(row.note)})` : ""}</span>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </details>
      </article>
    `;
  }

  function financeNoticeCard(finance) {
    if (!finance) return "";
    const notices = Array.isArray(finance.notices) ? finance.notices : [];
    return `
      <article class="mini-card finance-card status-${paymentStatusClass(finance.status)}">
        <div class="mini-card-top">
          <p class="mini-card-title">Oylik nazorati (${escapeHtml(finance.month || "")})</p>
          <span class="mini-badge">${escapeHtml(paymentStatusLabel(finance.status))}</span>
        </div>
        <p class="mini-card-copy">Oylik: ${escapeHtml(formatMoney(finance.monthlyFee || 0))} • To'langan: ${escapeHtml(formatMoney(finance.paid || 0))} • Qolgan: ${escapeHtml(formatMoney(finance.remaining || 0))}</p>
        <div class="mini-card-meta">
          <span>To'lov kuni: ${escapeHtml(String(finance.dueDay || "-"))}</span>
          <span>Muddat: ${escapeHtml(finance.dueDate || "-")}</span>
        </div>
        ${
          notices.length
            ? `<div class="notice-list">${notices.map((item) => `<p class="notice-item">${escapeHtml(item)}</p>`).join("")}</div>`
            : ""
        }
      </article>
    `;
  }

  async function renderLandingPage() {
    clearPolling();
    const site = (await loadSiteContent()) || {};
    const courses = Array.isArray(site.courses) && site.courses.length
      ? site.courses
      : ["Ingliz tili", "Rus tili", "Mobile dasturlash"];
    const gallery = Array.isArray(site.gallery) ? site.gallery : [];
    const loginTarget = state.token ? routes.dashboard : routes.login;

    app.innerHTML = `
      <main class="landing-shell">
        <header class="landing-header">
          <a class="landing-brand" href="${routes.landing}">
            ${site.logoUrl ? `<img src="${escapeHtml(site.logoUrl)}" alt="${escapeHtml(brandName())} logo">` : `<span class="landing-logo-fallback">${escapeHtml((brandName() || "C").slice(0, 1).toUpperCase())}</span>`}
            <div>
              <p>${escapeHtml(brandName())}</p>
              <span>${escapeHtml(site.brandTagline || "O'quv markazi")}</span>
            </div>
          </a>
          <div class="page-actions">
            <button class="icon-button" data-theme-toggle aria-label="Mavzu">${resolvedTheme() === "dark" ? icons.sun : icons.moon}</button>
            <a class="button secondary" href="${routes.login}">Kirish</a>
            <a class="button primary" href="${loginTarget}">${state.token ? "Kabinet" : "Boshlash"}</a>
          </div>
        </header>

        <section class="landing-hero panel">
          <div class="landing-hero-copy">
            <p class="kicker">${escapeHtml(site.brandTagline || "Cliffs Learning Center")}</p>
            <h1>${escapeHtml(site.heroTitle || "Zamonaviy ta'lim bilan kuchli kelajak")}</h1>
            <p>${escapeHtml(site.heroSubtitle || "Ingliz tili, rus tili, mobile dasturlash va yana ko'plab fanlar bo'yicha intensiv kurslar.")}</p>
            <div class="landing-hero-actions">
              <a class="button primary" href="${routes.login}">O'quvchi kabineti</a>
              <a class="button secondary" href="#courses">Kurslar</a>
            </div>
            <div class="landing-meta">
              ${site.phone ? `<span>Telefon: ${escapeHtml(site.phone)}</span>` : ""}
              ${site.address ? `<span>Manzil: ${escapeHtml(site.address)}</span>` : ""}
              ${site.workingHours ? `<span>Ish vaqti: ${escapeHtml(site.workingHours)}</span>` : ""}
            </div>
          </div>
          <div class="landing-hero-media">
            ${
              site.heroImage
                ? `<img src="${escapeHtml(site.heroImage)}" alt="${escapeHtml(brandName())} dars jarayoni">`
                : `<div class="landing-hero-placeholder">Cliffs</div>`
            }
          </div>
        </section>

        <section class="panel panel-pad landing-section">
          <div class="landing-trust-grid">
            <article class="landing-trust-card">
              <strong>${escapeHtml(String(courses.length))}+</strong>
              <span>Faol yo'nalish</span>
            </article>
            <article class="landing-trust-card">
              <strong>Offline / Online</strong>
              <span>Moslashuvchan dars formati</span>
            </article>
            <article class="landing-trust-card">
              <strong>Praktik yondashuv</strong>
              <span>Natijaga yo'naltirilgan tizim</span>
            </article>
          </div>
        </section>

        <section id="courses" class="panel panel-pad landing-section">
          <div class="section-head">
            <div>
              <h2 class="section-title">Asosiy yo'nalishlar</h2>
              <p class="section-subtitle">Amaliy kurslar va natijaga yo'naltirilgan dasturlar</p>
            </div>
          </div>
          <div class="landing-courses">
            ${courses
              .map(
                (item) => `
                  <article class="landing-course-card">
                    <p>${escapeHtml(item)}</p>
                    <span>Professional mentorlar bilan</span>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="panel panel-pad landing-section">
          <div class="section-head">
            <div>
              <h2 class="section-title">Nima uchun Cliffs?</h2>
              <p class="section-subtitle">Rasmiy, tartibli va natija beradigan o'quv jarayoni</p>
            </div>
          </div>
          <div class="landing-value-grid">
            <article class="landing-value-card">
              <p>Mentor nazorati</p>
              <span>Har bir guruhga mas'ul o'qituvchi biriktiriladi, progress monitoring yuritiladi.</span>
            </article>
            <article class="landing-value-card">
              <p>Davomat va intizom</p>
              <span>Davomat, vazifa va reytinglar platforma orqali shaffof ko'rinadi.</span>
            </article>
            <article class="landing-value-card">
              <p>Karyera yo'nalishi</p>
              <span>Til va IT yo'nalishlarida amaliy portfel hamda real loyihalar ustida ish.</span>
            </article>
          </div>
        </section>

        <section class="panel panel-pad landing-section">
          <div class="section-head">
            <div>
              <h2 class="section-title">Markaz hayoti</h2>
              <p class="section-subtitle">Dars jarayonidan lavhalar</p>
            </div>
          </div>
          <div class="landing-gallery">
            ${
              gallery.length
                ? gallery
                    .map(
                      (url, index) => `
                        <figure class="landing-gallery-item">
                          <img src="${escapeHtml(url)}" alt="Cliffs gallery ${index + 1}">
                        </figure>
                      `
                    )
                    .join("")
                : `<div class="empty-state"><h3>Galereya bo'sh</h3><p>Admin paneldan rasmlar qo'shing.</p></div>`
            }
          </div>
        </section>

        <section class="panel panel-pad landing-section">
          <div class="section-head">
            <div>
              <h2 class="section-title">Aloqa</h2>
              <p class="section-subtitle">Ro'yxatdan o'tish va konsultatsiya uchun</p>
            </div>
          </div>
          <div class="landing-contact">
            ${site.phone ? `<a class="button secondary" href="tel:${escapeHtml(site.phone)}">${escapeHtml(site.phone)}</a>` : ""}
            ${site.telegram ? `<a class="button secondary" href="${escapeHtml(site.telegram)}" target="_blank" rel="noopener noreferrer">Telegram</a>` : ""}
            <a class="button primary" href="${routes.login}">Kabinetga kirish</a>
          </div>
        </section>

        <section class="panel panel-pad landing-cta">
          <h2>${escapeHtml(brandName())} bilan bugun boshlang</h2>
          <p>Qabul bo'yicha konsultatsiya oling va o'zingizga mos guruhga birikting.</p>
          <div class="landing-contact">
            ${site.phone ? `<a class="button secondary" href="tel:${escapeHtml(site.phone)}">Qo'ng'iroq</a>` : ""}
            ${site.telegram ? `<a class="button secondary" href="${escapeHtml(site.telegram)}" target="_blank" rel="noopener noreferrer">Telegram</a>` : ""}
            <a class="button primary" href="${routes.login}">Kabinetga kirish</a>
          </div>
        </section>
      </main>
      <div id="toast" class="toast"></div>
    `;
    bindThemeToggle();
  }

  async function renderLoginPage() {
    renderAuthLayout({
      title: "Cliffs o'quv markazi boshqaruv tizimi.",
      subtitle: "Ingliz tili, rus tili, mobile dasturlash va boshqa kurslar uchun yagona platforma.",
      formTitle: "Login",
      formSubtitle: "Admin bergan login yoki telefon orqali kiring.",
      formContent: `
        <form id="login-form" class="auth-form">
          <div class="field">
            <label for="login-identifier">Username yoki telefon</label>
            <input class="input" id="login-identifier" name="identifier" placeholder="@username yoki +998..." required>
          </div>
          <div class="field">
            <label for="login-password">Parol</label>
            <input class="input" id="login-password" name="password" type="password" placeholder="Parol" required>
          </div>
          <button class="button primary block" type="submit">${icons.chats}<span>Kirish</span></button>
          <p class="auth-foot">Akkauntni admin yaratadi. Login ma'lumotlarini markaz administratoridan oling.</p>
        </form>
      `,
    });

    document.getElementById("login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const button = event.currentTarget.querySelector("button");
      button.disabled = true;
      try {
        const data = await api("/api/login", {
          method: "POST",
          body: {
            identifier: form.get("identifier"),
            password: form.get("password"),
          },
        });
        setToken(data.token);
        window.location.replace(routes.dashboard);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  async function renderRegisterPage() {
    renderAuthLayout({
      title: "Yangi chat maydonini bir necha daqiqada oching.",
      subtitle: "Birinchi foydalanuvchi avtomatik admin bo'ladi va asosiy statistikani ko'radi.",
      formTitle: "Register",
      formSubtitle: "Minimal ma'lumot bilan akkaunt yarating.",
      formContent: `
        <form id="register-form" class="auth-form">
          <div class="grid-2">
            <div class="field">
              <label for="register-name">To'liq ism</label>
              <input class="input" id="register-name" name="fullName" placeholder="Ali Valiyev" required>
            </div>
            <div class="field">
              <label for="register-username">Username</label>
              <input class="input" id="register-username" name="username" placeholder="ali_dev" required>
            </div>
          </div>
          <div class="field">
            <label for="register-phone">Telefon</label>
            <input class="input" id="register-phone" name="phone" placeholder="+998 90 123 45 67">
          </div>
          <div class="field">
            <label for="register-password">Parol</label>
            <input class="input" id="register-password" name="password" type="password" placeholder="Kamida 6 belgi" required>
          </div>
          <button class="button primary block" type="submit">${icons.plus}<span>Ro'yxatdan o'tish</span></button>
          <p class="auth-foot">Akkaunt bormi? <a href="${routes.login}">Kirish</a></p>
        </form>
      `,
    });

    document.getElementById("register-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const button = event.currentTarget.querySelector("button");
      button.disabled = true;
      try {
        const data = await api("/api/register", {
          method: "POST",
          body: {
            fullName: form.get("fullName"),
            username: form.get("username"),
            phone: form.get("phone"),
            password: form.get("password"),
          },
        });
        setToken(data.token);
        window.location.replace(routes.dashboard);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  async function renderDashboardPage() {
    clearPolling();
    const [meData, dashboardData] = await Promise.all([loadMe(), api("/api/dashboard")]);
    const chatList = dashboardData.recentChats || [];
    const groups = dashboardData.groups || [];
    const announcements = dashboardData.announcements || [];
    const scheduleToday = dashboardData.todaySchedule || [];
    const materials = dashboardData.materials || [];
    const finance = dashboardData.finance || null;
    const subtitleMap = {
      teacher: "Bugungi darslar, guruhlar va tezkor boshqaruv shu yerda.",
      abituriyent: "Kurslar, vazifalar va foydali chatlar bir joyda.",
      admin: "Markaz bo'yicha tezkor kuzatuv va aloqa oynasi.",
    };

    renderPage({
      title: "Dashboard",
      subtitle: subtitleMap[meData.user.role] || "O'quv markaz uchun asosiy sahifa.",
      actions: `
        ${actionButton("search", routes.search, "Qidiruv")}
      `,
      stats: `
        ${quickChip(groups.length, "Guruh")}
        ${quickChip(scheduleToday.length, "Bugungi dars")}
        ${quickChip(announcements.length, "E'lon")}
        ${quickChip(materials.length, "Material")}
        ${isRole(meData.user, "abituriyent") ? quickChip(formatMoney(finance?.remaining || 0), "Qolgan oylik") : ""}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">Bo'limlar</h2>
              <p class="section-subtitle">Funksiyalar alohida sahifalarda: ixcham va tartibli.</p>
            </div>
          </div>
          <div class="dashboard-strip">
            <article class="mini-stat">
              <strong>${escapeHtml(roleLabel(meData.user.role))}</strong>
              <span>${groups.length ? `${groups.length} ta kurs biriktirilgan` : "Hali guruh biriktirilmagan"}</span>
            </article>
            <article class="mini-stat">
              <strong>${scheduleToday.length ? `${scheduleToday.length} ta dars` : "Dars yo'q"}</strong>
              <span>${meData.user.role === "teacher" ? "Davomatni guruh ichida belgilaysiz" : "Jadval va vazifalar pastda"}</span>
            </article>
          </div>
          ${isRole(meData.user, "abituriyent") && finance ? financeNoticeCard(finance) : ""}
          <div class="module-grid">
            ${moduleTile("groups", routes.groups, "Guruhlar", "Kurs guruhlari va chatlari")}
            ${moduleTile("bell", routes.announcements, "E'lonlar", "Markaz va guruh yangiliklari")}
            ${moduleTile("calendar", routes.schedule, "Jadval", "Haftalik darslar")}
            ${moduleTile("book", routes.materials, "Materiallar", "Vazifa va dars fayllari")}
            ${moduleTile("attendance", routes.attendance, "Davomat", "To'liq tarix va hisobot")}
            ${moduleTile("ai", routes.ai, "AI Ustoz", "Dars bo'yicha tezkor yordam")}
            ${moduleTile("search", routes.search, "Qidiruv", "Kontakt va guruh topish")}
            ${moduleTile("profile", profileHref(meData.user.id), "Profil", "Shaxsiy kabinet")}
            ${isRole(meData.user, "admin") ? moduleTile("admin", routes.admin, "Admin", "Boshqaruv paneli") : ""}
            ${isRole(meData.user, "admin") ? moduleTile("money", routes.adminFinance, "Finance CRM", "To'lov, maosh va xarajat") : ""}
          </div>
        </section>
        <div class="split-layout">
          <section class="panel panel-pad stack">
            <div class="section-head">
              <div>
                <h2 class="section-title">Bugungi jadval</h2>
                <p class="section-subtitle">${scheduleToday.length} ta dars yoki mashg'ulot</p>
              </div>
            </div>
            ${miniCardList(scheduleToday, (item) => scheduleCard(item), "Jadval bo'sh", "Bugun uchun hali dars belgilanmagan.")}
          </section>
          <section class="panel panel-pad stack">
            <div class="section-head">
              <div>
                <h2 class="section-title">So'nggi e'lonlar</h2>
                <p class="section-subtitle">Admin va guruh ustozlaridan yangilanishlar</p>
              </div>
            </div>
            ${miniCardList(announcements, (item) => announcementCard(item, true), "E'lon yo'q", "Hozircha e'lonlar kiritilmagan.")}
          </section>
        </div>
        <section class="panel panel-pad stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">Material va vazifalar</h2>
              <p class="section-subtitle">Yangi materiallar, uyga vazifalar va dars qaydlari</p>
            </div>
          </div>
          ${miniCardList(materials, (item) => materialCard(item, true), "Material yo'q", "Ustoz yoki admin qo'shganda shu yerda ko'rinadi.")}
        </section>
        <section class="stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">Mening guruhlarim</h2>
              <p class="section-subtitle">${groups.length} ta faol kurs guruhi</p>
            </div>
          </div>
          ${
            groups.length
              ? `<div class="conversation-list">${groups
                  .map(
                    (group) => `
                      <article class="conversation-item">
                        <a class="conversation-main conversation-link" href="${routes.group}?id=${group.id}">
                          ${avatar(group.name, group.avatar, "avatar large")}
                          <div class="conversation-copy">
                            <div class="conversation-top">
                              <p class="conversation-name">${escapeHtml(group.name)}</p>
                              <span class="time-tag">${group.todayAttendanceTaken ? "Davomat bor" : "Davomat kutilmoqda"}</span>
                            </div>
                            <p class="conversation-preview">${escapeHtml(group.subject || "Fan")}</p>
                            <p class="conversation-preview">Ustoz: ${escapeHtml(group.teacher?.fullName || "Biriktirilmagan")}</p>
                          </div>
                        </a>
                        <div class="page-actions">
                          ${profileAction(group.teacher, "Ustoz")}
                        </div>
                      </article>
                    `
                  )
                  .join("")}</div>`
              : emptyState("Guruh topilmadi", "Admin sizni kursga biriktirgach shu yerda ko'rinadi.")
          }
        </section>
        <section class="stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">Shaxsiy chatlar</h2>
              <p class="section-subtitle">${chatList.length} ta suhbat</p>
            </div>
          </div>
          ${
            chatList.length
                ? `<div class="conversation-list">${chatList.map(conversationItem).join("")}</div>`
                : emptyState("Chat yo'q", "Qidiruv bo'limidan foydalanuvchi topib, birinchi suhbatni boshlang.", `<a class="button primary" href="${routes.search}">Qidiruvga o'tish</a>`)
          }
        </section>
      `,
    });
  }

  async function renderChatsPage() {
    clearPolling();
    await loadMe();
    const [directData, groupData] = await Promise.all([api("/api/chats?scope=direct"), api("/api/chats?scope=group")]);
    const directChats = directData.chats || [];
    const groupChats = groupData.chats || [];
    const allChats = [...directChats, ...groupChats].sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));

    renderPage({
      title: "Chatlar",
      subtitle: "Shaxsiy va guruh suhbatlari alohida boshqariladi.",
      actions: `
        ${actionButton("search", routes.search, "Qidiruv")}
      `,
      stats: `
        ${quickChip(directChats.length, "Shaxsiy")}
        ${quickChip(groupChats.length, "Guruh")}
        ${quickChip(allChats.length, "Jami")}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">So'nggi suhbatlar</h2>
              <p class="section-subtitle">${allChats.length} ta chat</p>
            </div>
          </div>
          ${
            allChats.length
              ? `<div class="conversation-list">${allChats.map(conversationItem).join("")}</div>`
              : emptyState("Chatlar bo'sh", "Qidiruv bo'limidan foydalanuvchi topib suhbatni boshlang.", `<a class="button primary" href="${routes.search}">Qidiruvga o'tish</a>`)
          }
        </section>
      `,
    });
  }

  async function renderGroupsPage() {
    clearPolling();
    const [meData, groupsData, allGroupsData] = await Promise.all([loadMe(), api("/api/chats?scope=group"), api("/api/groups")]);
    const groups = groupsData.chats || [];
    const allGroups = allGroupsData.groups || [];
    const isTeacher = meData.user.role === "teacher";
    const isStudent = meData.user.role === "abituriyent";

    renderPage({
      title: "Guruhlar",
      subtitle: "Admin tomonidan biriktirilgan kurs guruhlari.",
      actions: `
        ${actionButton("search", routes.search, "Qidiruv")}
        ${profileButton()}
      `,
      stats: `
        ${quickChip(meData.stats.group, "Mening guruhlarim")}
        ${quickChip(groups.filter((item) => item.subject).length, "Kurs guruhlari")}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">Kurs guruhlari</h2>
              <p class="section-subtitle">${groups.length} ta guruh</p>
            </div>
          </div>
          ${
            groups.length
              ? `<div class="conversation-list">${groups
                  .map(
                    (group) => `
                    <article class="conversation-item">
                      <a class="conversation-main conversation-link" href="${routes.group}?id=${group.id}">
                        ${avatar(group.name, group.avatar, "avatar large")}
                        <div class="conversation-copy">
                          <div class="conversation-top">
                            <p class="conversation-name">${escapeHtml(group.name)}</p>
                            <span class="time-tag">${escapeHtml(group.subject || "Fan belgilanmagan")}</span>
                          </div>
                          <p class="conversation-preview">O'qituvchi: ${escapeHtml(group.teacher?.fullName || "Biriktirilmagan")}</p>
                          <p class="conversation-preview">${escapeHtml(group.description || "Kurs guruhi")}</p>
                        </div>
                      </a>
                      <div class="page-actions">
                        ${profileAction(group.teacher, "Ustoz profili")}
                      </div>
                    </article>
                  `
                  )
                  .join("")}</div>`
              : emptyState("Guruh yo'q", "Siz uchun hali guruh biriktirilmagan.")
          }
          <div class="section-head">
            <div>
              <h2 class="section-title">Markaz kurslari</h2>
              <p class="section-subtitle">${allGroups.length} ta</p>
            </div>
          </div>
          ${
            allGroups.length
              ? `<div class="conversation-list">${allGroups
                  .map(
                    (group) => `
                    <article class="conversation-item">
                      <a class="conversation-main conversation-link" href="${group.isMember ? `${routes.group}?id=${group.id}` : routes.groups}">
                        ${avatar(group.name, group.avatar, "avatar large")}
                        <div class="conversation-copy">
                          <div class="conversation-top">
                            <p class="conversation-name">${escapeHtml(group.name)}</p>
                            <span class="time-tag">${escapeHtml(group.subject || "Fan")}</span>
                          </div>
                          <p class="conversation-preview">O'qituvchi: ${escapeHtml(group.teacher?.fullName || "-")}</p>
                          <p class="conversation-preview">${group.isMember ? "Siz a'zosiz" : "Biriktirishni admin qiladi"}</p>
                        </div>
                      </a>
                      <div class="page-actions">
                        ${profileAction(group.teacher, "Ustoz profili")}
                      </div>
                    </article>
                  `
                  )
                  .join("")}</div>`
              : `<p class="muted-copy">Kurs guruhlari hali qo'shilmagan.</p>`
          }
          ${
            isTeacher
              ? `<div class="empty-state"><h3>O'qituvchi rejimi</h3><p>Davomatni guruh ichidan belgilaysiz.</p></div>`
              : ""
          }
          ${
            isStudent
              ? `<div class="empty-state"><h3>Abituriyent rejimi</h3><p>Davomat natijalarini guruh sahifasida ko'rasiz.</p></div>`
              : ""
          }
        </section>
      `,
    });
  }

  async function renderAnnouncementsPage() {
    clearPolling();
    const data = await api("/api/announcements");
    const list = data.announcements || [];
    const pinned = list.filter((item) => item.pinned).length;
    renderPage({
      title: "E'lonlar",
      subtitle: "Markaz va guruhlardagi barcha yangilanishlar.",
      actions: `
        ${actionButton("groups", routes.groups, "Guruhlar")}
        ${actionButton("home", routes.dashboard, "Dashboard")}
      `,
      stats: `
        ${quickChip(list.length, "Jami")}
        ${quickChip(pinned, "Muhim")}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">E'lonlar lentasi</h2>
              <p class="section-subtitle">${list.length} ta yozuv</p>
            </div>
          </div>
          ${miniCardList(list, (item) => announcementCard(item, true), "E'lon topilmadi", "Hozircha ko'rsatish uchun e'lon yo'q.")}
        </section>
      `,
    });
  }

  async function renderSchedulePage() {
    clearPolling();
    const data = await api("/api/schedules");
    const list = data.schedules || [];
    renderPage({
      title: "Jadval",
      subtitle: "Kurslar bo'yicha haftalik darslar.",
      actions: `
        ${actionButton("groups", routes.groups, "Guruhlar")}
        ${actionButton("home", routes.dashboard, "Dashboard")}
      `,
      stats: `
        ${quickChip(list.length, "Yozuv")}
        ${quickChip([...new Set(list.map((item) => item.dayOfWeek))].length, "Faol kun")}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="field">
            <label for="schedule-day-filter">Kun bo'yicha filtrlash</label>
            <select class="input" id="schedule-day-filter">
              <option value="all">Barchasi</option>
              <option value="1">Dushanba</option>
              <option value="2">Seshanba</option>
              <option value="3">Chorshanba</option>
              <option value="4">Payshanba</option>
              <option value="5">Juma</option>
              <option value="6">Shanba</option>
              <option value="0">Yakshanba</option>
            </select>
          </div>
          <div id="schedule-list">${miniCardList(list, (item) => scheduleCard(item, true), "Jadval yo'q", "Hozircha dars jadvali kiritilmagan.")}</div>
        </section>
      `,
    });
    const root = document.getElementById("schedule-list");
    document.getElementById("schedule-day-filter").addEventListener("change", (event) => {
      const value = event.target.value;
      const filtered = value === "all" ? list : list.filter((item) => String(item.dayOfWeek) === String(value));
      root.innerHTML = miniCardList(filtered, (item) => scheduleCard(item, true), "Natija yo'q", "Tanlangan kun uchun dars topilmadi.");
    });
  }

  async function renderMaterialsPage() {
    clearPolling();
    const data = await api("/api/materials");
    const list = data.materials || [];
    renderPage({
      title: "Materiallar",
      subtitle: "Vazifalar, dars qaydlari va fayl havolalari.",
      actions: `
        ${actionButton("attendance", routes.attendance, "Davomat")}
        ${actionButton("home", routes.dashboard, "Dashboard")}
      `,
      stats: `
        ${quickChip(list.length, "Jami")}
        ${quickChip(list.filter((item) => item.type === "homework").length, "Vazifa")}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="field">
            <label for="material-type-filter">Tur bo'yicha filtrlash</label>
            <select class="input" id="material-type-filter">
              <option value="all">Barchasi</option>
              <option value="material">Material</option>
              <option value="homework">Vazifa</option>
              <option value="lesson">Dars qaydi</option>
            </select>
          </div>
          <div id="materials-list">${miniCardList(list, (item) => materialCard(item, true), "Material yo'q", "Hozircha material topilmadi.")}</div>
        </section>
      `,
    });
    const root = document.getElementById("materials-list");
    document.getElementById("material-type-filter").addEventListener("change", (event) => {
      const value = event.target.value;
      const filtered = value === "all" ? list : list.filter((item) => item.type === value);
      root.innerHTML = miniCardList(filtered, (item) => materialCard(item, true), "Natija yo'q", "Tanlangan turda material yo'q.");
    });
  }

  async function renderMaterialDetailPage() {
    clearPolling();
    const materialId = queryParam("id");
    if (!materialId) {
      window.location.replace(routes.materials);
      return;
    }
    const data = await api(`/api/materials/${encodeURIComponent(materialId)}`);
    const material = data.material;
    const group = data.group;
    const mySubmission = data.mySubmission || null;
    const canSubmit = !!data.canSubmit;
    const canReview = !!data.canReview;
    const submissions = data.submissions || [];

    renderPage({
      title: material?.title || "Material",
      subtitle: group?.name ? `${group.name}${group.subject ? ` • ${group.subject}` : ""}` : "Batafsil sahifa",
      actions: `
        ${actionButton("book", routes.materials, "Materiallar")}
        ${actionButton("home", routes.dashboard, "Dashboard")}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="mini-card">
            <div class="mini-card-top">
              <p class="mini-card-title">${escapeHtml(material?.title || "Material")}</p>
              <span class="mini-badge">${escapeHtml(materialTypeLabel(material?.type))}</span>
            </div>
            <p class="mini-card-copy">${escapeHtml(material?.description || "")}</p>
            <div class="mini-card-meta">
              <span>${escapeHtml(material?.authorName || "Admin")}</span>
              ${material?.dueDate ? `<span>Deadline: ${escapeHtml(material.dueDate)}</span>` : ""}
            </div>
            ${
              material?.link
                ? `<a class="button secondary" href="${escapeHtml(material.link)}" target="_blank" rel="noopener noreferrer">Material havolasi</a>`
                : ""
            }
          </div>
          ${
            canSubmit
              ? `
                <section class="panel panel-pad stack">
                  <div class="section-head">
                    <div>
                      <h2 class="section-title">Vazifani yuborish</h2>
                      <p class="section-subtitle">Topshiriqni matn, havola yoki rasm sifatida yuboring.</p>
                    </div>
                  </div>
                  <form id="material-submit-form" class="stack">
                    <div class="field">
                      <label for="material-submit-text">Javob matni</label>
                      <textarea class="textarea" id="material-submit-text" placeholder="Topshiriq javobingiz...">${escapeHtml(mySubmission?.text || "")}</textarea>
                    </div>
                    <div class="field">
                      <label for="material-submit-link">Havola</label>
                      <input class="input" id="material-submit-link" placeholder="https://..." value="${escapeHtml(mySubmission?.link || "")}">
                    </div>
                    <div class="field">
                      <label for="material-submit-file">Rasm/fayl (Cloudinary)</label>
                      <input class="input" id="material-submit-file" type="file" accept="image/*">
                    </div>
                    <button class="button primary" type="submit">${icons.send}<span>Yuborish</span></button>
                  </form>
                  ${
                    mySubmission
                      ? `
                        <div class="mini-card">
                          <p class="mini-card-title">Oxirgi yuborilgan variant</p>
                          <p class="mini-card-copy">${escapeHtml(mySubmission.text || "Matn yo'q")}</p>
                          <div class="mini-card-meta">
                            <span>Status: ${escapeHtml(mySubmission.status || "submitted")}</span>
                            ${mySubmission.score !== null && mySubmission.score !== undefined ? `<span>Ball: ${escapeHtml(String(mySubmission.score))}</span>` : ""}
                          </div>
                          ${mySubmission.link ? `<a class="inline-link" href="${escapeHtml(mySubmission.link)}" target="_blank" rel="noopener noreferrer">Yuborgan havola</a>` : ""}
                          ${mySubmission.attachmentUrl ? `<a class="inline-link" href="${escapeHtml(mySubmission.attachmentUrl)}" target="_blank" rel="noopener noreferrer">Yuborgan fayl</a>` : ""}
                          ${mySubmission.teacherNote ? `<p class="mini-card-copy">Izoh: ${escapeHtml(mySubmission.teacherNote)}</p>` : ""}
                        </div>
                      `
                      : ""
                  }
                </section>
              `
              : ""
          }
          ${
            canReview
              ? `
                <section class="panel panel-pad stack">
                  <div class="section-head">
                    <div>
                      <h2 class="section-title">Topshiriqlar</h2>
                      <p class="section-subtitle">${submissions.length} ta topshiriq yuborilgan</p>
                    </div>
                  </div>
                  <div class="mini-card-list">
                    ${submissions
                      .map(
                        (item) => `
                          <article class="mini-card">
                            <div class="mini-card-top">
                              <p class="mini-card-title">${escapeHtml(item.student?.fullName || "Talaba")}</p>
                              <span class="mini-badge">${escapeHtml(item.status || "submitted")}</span>
                            </div>
                            <p class="mini-card-copy">${escapeHtml(item.text || "Matn yo'q")}</p>
                            <div class="mini-card-meta">
                              ${item.score !== null && item.score !== undefined ? `<span>Ball: ${escapeHtml(String(item.score))}</span>` : ""}
                              <span>${escapeHtml(formatDate(item.updatedAt || item.createdAt))}</span>
                            </div>
                            ${item.link ? `<a class="inline-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Havola</a>` : ""}
                            ${item.attachmentUrl ? `<a class="inline-link" href="${escapeHtml(item.attachmentUrl)}" target="_blank" rel="noopener noreferrer">Fayl</a>` : ""}
                            <div class="page-actions">
                              <button
                                class="button secondary"
                                data-review-material
                                data-student-id="${escapeHtml(item.studentId)}"
                                data-status="${escapeHtml(item.status || "submitted")}"
                                data-score="${item.score !== null && item.score !== undefined ? escapeHtml(String(item.score)) : ""}"
                                data-note="${escapeHtml(item.teacherNote || "")}"
                              >Baholash</button>
                            </div>
                          </article>
                        `
                      )
                      .join("")}
                  </div>
                </section>
              `
              : ""
          }
        </section>
      `,
    });

    document.getElementById("material-submit-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button");
      button.disabled = true;
      try {
        const file = document.getElementById("material-submit-file").files?.[0] || null;
        const uploaded = file ? await uploadFile(file, "submissions") : null;
        await api(`/api/materials/${encodeURIComponent(materialId)}/submissions`, {
          method: "POST",
          body: {
            text: document.getElementById("material-submit-text").value,
            link: document.getElementById("material-submit-link").value,
            attachmentUrl: uploaded?.url || "",
          },
        });
        toast("Topshiriq yuborildi", "success");
        await renderMaterialDetailPage();
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });

    document.querySelectorAll("[data-review-material]").forEach((button) => {
      button.addEventListener("click", async () => {
        const status = window.prompt("Status (submitted, reviewed, accepted, rejected)", button.dataset.status || "reviewed");
        if (status === null) return;
        const score = window.prompt("Ball (0-100, ixtiyoriy)", button.dataset.score || "");
        if (score === null) return;
        const teacherNote = window.prompt("Izoh", button.dataset.note || "");
        if (teacherNote === null) return;
        try {
          await api(`/api/materials/${encodeURIComponent(materialId)}/submissions/review`, {
            method: "PATCH",
            body: {
              studentId: button.dataset.studentId,
              status,
              score,
              teacherNote,
            },
          });
          toast("Baholash saqlandi", "success");
          await renderMaterialDetailPage();
        } catch (error) {
          toast(error.message, "error");
        }
      });
    });
  }

  async function renderAttendancePage() {
    clearPolling();
    await loadMe();
    const currentMonth = new Date().toISOString().slice(0, 7);
    renderPage({
      title: "Davomat Tarixi",
      subtitle: "Oldingi barcha davomatlar bir joyda.",
      actions: `
        ${actionButton("groups", routes.groups, "Guruhlar")}
        ${actionButton("home", routes.dashboard, "Dashboard")}
      `,
      content: `
        <section class="panel panel-pad stack">
          <div class="grid-2">
            <div class="field">
              <label for="attendance-group-filter">Guruh</label>
              <select class="input" id="attendance-group-filter">
                <option value="">Barcha guruhlar</option>
              </select>
            </div>
            <div class="field">
              <label for="attendance-month-filter">Oy</label>
              <input class="input" id="attendance-month-filter" type="month" value="${escapeHtml(currentMonth)}">
            </div>
          </div>
          <div class="page-actions">
            <button class="button secondary" id="attendance-run-filter">${icons.search}<span>Filtrlash</span></button>
          </div>
          <div id="attendance-history-root">${emptyState("Yuklanmoqda", "Davomat tarixi olinmoqda...")}</div>
        </section>
      `,
    });

    const groupFilter = document.getElementById("attendance-group-filter");
    const monthFilter = document.getElementById("attendance-month-filter");
    const root = document.getElementById("attendance-history-root");

    async function loadHistory() {
      const groupId = groupFilter.value;
      const month = monthFilter.value;
      const params = new URLSearchParams();
      if (groupId) params.set("groupId", groupId);
      if (month) params.set("month", month);
      params.set("limit", "360");
      const data = await api(`/api/attendance/history?${params.toString()}`);
      const groups = data.groups || [];
      if (!groupFilter.dataset.ready) {
        groupFilter.innerHTML = `<option value="">Barcha guruhlar</option>${groups
          .map((group) => `<option value="${group.id}">${escapeHtml(group.name)}${group.subject ? ` (${escapeHtml(group.subject)})` : ""}</option>`)
          .join("")}`;
        groupFilter.dataset.ready = "1";
      }
      const history = data.history || [];
      root.innerHTML = history.length ? `<div class="mini-card-list">${history.map(attendanceHistoryCard).join("")}</div>` : emptyState("Davomat topilmadi", "Tanlangan filtrlarda tarix mavjud emas.");
    }

    document.getElementById("attendance-run-filter").addEventListener("click", async () => {
      try {
        await loadHistory();
      } catch (error) {
        toast(error.message, "error");
      }
    });
    try {
      await loadHistory();
    } catch (error) {
      root.innerHTML = emptyState("Xatolik", error.message || "Davomat olinmadi");
    }
  }

  async function renderSearchPage() {
    clearPolling();
    await loadMe();

    renderPage({
      title: "Qidiruv",
      subtitle: "Kontaktlarni toping va mavjud guruhlarni tez oching.",
      actions: profileButton(),
      content: `
        <section class="panel panel-pad stack">
          <div class="field">
            <label for="search-input">Foydalanuvchi yoki guruh qidiring</label>
            <input class="input" id="search-input" placeholder="Ali, @team, group...">
          </div>
        </section>
        <section class="panel panel-pad stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">Kontaktlar</h2>
              <p class="section-subtitle" id="users-count">0 ta</p>
            </div>
          </div>
          <div class="result-list" id="users-results"></div>
        </section>
        <section class="panel panel-pad stack">
          <div class="section-head">
            <div>
              <h2 class="section-title">Guruhlar</h2>
              <p class="section-subtitle" id="groups-count">0 ta</p>
            </div>
          </div>
          <div class="result-list" id="groups-results"></div>
        </section>
      `,
    });

    const searchInput = document.getElementById("search-input");
    const usersRoot = document.getElementById("users-results");
    const groupsRoot = document.getElementById("groups-results");
    const usersCount = document.getElementById("users-count");
    const groupsCount = document.getElementById("groups-count");
    let debounceTimer = 0;

    async function runSearch() {
      try {
        const data = await api(`/api/search?q=${encodeURIComponent(searchInput.value.trim())}`);
        const users = data.users || [];
        const groups = data.groups || [];
        usersCount.textContent = `${users.length} ta`;
        groupsCount.textContent = `${groups.length} ta`;
        usersRoot.innerHTML = users.length
          ? users.map(userResult).join("")
          : emptyState("Kontakt topilmadi", "Boshqa so'z bilan qidirib ko'ring.");
        groupsRoot.innerHTML = groups.length
          ? groups.map(groupResult).join("")
          : emptyState("Guruh topilmadi", "Siz a'zo bo'lgan guruhlar shu yerda ko'rinadi.");
        attachStartChatHandlers();
      } catch (error) {
        toast(error.message, "error");
      }
    }

    searchInput.addEventListener("input", () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(runSearch, 250);
    });

    await runSearch();
  }

  async function renderProfilePage() {
    clearPolling();
    const meData = await loadMe();
    const profileId = queryParam("id") || meData.user.id;
    const profileData = await api(`/api/users/${profileId}/profile`);
    const user = profileData.user;
    const isSelf = profileData.isSelf;
    const groups = profileData.groups || [];
    const students = profileData.students || [];
    const attendanceFeed = profileData.attendanceFeed || [];
    const attendanceSummary = profileData.attendanceSummary || { total: 0, present: 0, absent: 0 };
    const finance = profileData.finance || null;
    let avatarFile = null;

    renderPage({
      title: isSelf ? "Mening profilim" : user.fullName,
      subtitle: isSelf ? "Shaxsiy kabinet va o'quv faoliyati." : `${roleLabel(user.role)} profili`,
      actions: `
        ${!isSelf ? `<button class="button secondary" id="profile-message">${icons.chats}<span>Yozish</span></button>` : ""}
        ${isSelf ? `<button class="button danger" id="logout-button">${icons.logout}<span>Chiqish</span></button>` : profileButton()}
      `,
      stats: `
        ${quickChip(profileData.stats.direct, "Direct chat")}
        ${quickChip(groups.length, "Guruh")}
        ${quickChip(user.role === "teacher" ? students.length : attendanceSummary.total, user.role === "teacher" ? "Talabalar" : "Davomat")}
        ${quickChip(user.role === "teacher" ? attendanceSummary.total : attendanceSummary.present, user.role === "teacher" ? "Davomat kunlari" : "Kelgan")}
        ${user.role === "abituriyent" && finance ? quickChip(formatMoney(finance.remaining || 0), "Qolgan oylik") : ""}
      `,
      content: `
        <section class="panel profile-hero">
          <div class="profile-cover"></div>
          <div class="profile-hero-body">
            ${avatar(user.fullName, user.avatar, "avatar xl profile-avatar-xl")}
            <div class="profile-hero-copy">
              <div class="profile-title-row">
                <h2 class="profile-name">${escapeHtml(user.fullName)}</h2>
                <span class="role-pill">${escapeHtml(roleLabel(user.role))}</span>
              </div>
              <p class="profile-handle">@${escapeHtml(user.username)}</p>
              <p class="profile-bio">${escapeHtml(user.bio || "O'quv markaz profili.")}</p>
              <div class="profile-meta-row">
                <span>${escapeHtml(user.phone || "Telefon kiritilmagan")}</span>
                ${
                  profileData.mentorTeacher?.id
                    ? `<a class="inline-link" href="${profileHref(profileData.mentorTeacher.id)}">Ustoz: ${escapeHtml(profileData.mentorTeacher.fullName)}</a>`
                    : ""
                }
              </div>
            </div>
          </div>
          <div class="profile-social-stats">
            <div><strong>${groups.length}</strong><span>Guruh</span></div>
            <div><strong>${profileData.stats.direct}</strong><span>Chat</span></div>
            <div><strong>${attendanceSummary.present}</strong><span>Kelgan</span></div>
            <div><strong>${attendanceSummary.absent}</strong><span>Yo'q</span></div>
          </div>
        </section>
        <div class="profile-social-grid">
          <aside class="stack">
            <section class="panel panel-pad profile-about">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Ma'lumotlar</h2>
                  <p class="section-subtitle">Asosiy profil tafsilotlari</p>
                </div>
              </div>
              <div class="profile-lines">
                <div class="profile-line"><span>Rol</span><strong>${escapeHtml(roleLabel(user.role))}</strong></div>
                <div class="profile-line"><span>Telefon</span><strong>${escapeHtml(user.phone || "-")}</strong></div>
                <div class="profile-line"><span>Username</span><strong>@${escapeHtml(user.username)}</strong></div>
                <div class="profile-line"><span>Yuborgan xabarlar</span><strong>${profileData.stats.sent}</strong></div>
              </div>
            </section>
            ${
              user.role === "abituriyent" && finance
                ? `
                  <section class="panel panel-pad">
                    <div class="section-head">
                      <div>
                        <h2 class="section-title">Oylik to'lov holati</h2>
                        <p class="section-subtitle">Admin belgilagan oylik va to'lov monitoringi</p>
                      </div>
                      <span class="role-pill ${paymentStatusClass(finance.status)}">${escapeHtml(paymentStatusLabel(finance.status))}</span>
                    </div>
                    <div class="profile-lines">
                      <div class="profile-line"><span>Oy</span><strong>${escapeHtml(finance.month || "-")}</strong></div>
                      <div class="profile-line"><span>Oylik summa</span><strong>${escapeHtml(formatMoney(finance.monthlyFee || 0))}</strong></div>
                      <div class="profile-line"><span>To'langan</span><strong>${escapeHtml(formatMoney(finance.paid || 0))}</strong></div>
                      <div class="profile-line"><span>Qolgan</span><strong>${escapeHtml(formatMoney(finance.remaining || 0))}</strong></div>
                      <div class="profile-line"><span>To'lov kuni</span><strong>${escapeHtml(String(finance.dueDay || "-"))} (${escapeHtml(finance.dueDate || "-")})</strong></div>
                    </div>
                    ${
                      (finance.notices || []).length
                        ? `<div class="notice-list" style="margin-top:10px;">${(finance.notices || [])
                            .map((item) => `<p class="notice-item">${escapeHtml(item)}</p>`)
                            .join("")}</div>`
                        : `<p class="muted-copy" style="margin-top:10px;">To'lov bo'yicha ogohlantirish yo'q.</p>`
                    }
                  </section>
                `
                : ""
            }
            ${
              isSelf
                ? `
                  <section class="panel panel-pad">
                    <div class="section-head">
                      <div>
                        <h2 class="section-title">Profilni tahrirlash</h2>
                        <p class="section-subtitle">Ijtimoiy ko'rinish saqlanadi, ma'lumot shu yerdan o'zgaradi.</p>
                      </div>
                    </div>
                    <label class="button secondary" for="profile-avatar-input">${icons.image}<span>Avatar tanlash</span></label>
                    <input class="hide" id="profile-avatar-input" type="file" accept="image/*">
                    <form id="profile-form" class="stack" style="margin-top:10px;">
                      <div class="grid-2">
                        <div class="field">
                          <label for="profile-name">To'liq ism</label>
                          <input class="input" id="profile-name" value="${escapeHtml(user.fullName)}" required>
                        </div>
                        <div class="field">
                          <label for="profile-username">Username</label>
                          <input class="input" id="profile-username" value="${escapeHtml(user.username)}" required>
                        </div>
                      </div>
                      <div class="field">
                        <label for="profile-phone">Telefon</label>
                        <input class="input" id="profile-phone" value="${escapeHtml(user.phone || "")}" placeholder="+998...">
                      </div>
                      <div class="field">
                        <label for="profile-bio">Bio</label>
                        <textarea class="textarea" id="profile-bio" placeholder="O'zingiz haqingizda qisqa yozing">${escapeHtml(user.bio || "")}</textarea>
                      </div>
                      <button class="button primary" type="submit">${icons.profile}<span>Saqlash</span></button>
                    </form>
                  </section>
                `
                : ""
            }
          </aside>
          <section class="stack">
            <section class="panel panel-pad">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Guruhlar</h2>
                  <p class="section-subtitle">${groups.length} ta kurs yoki chat guruhi</p>
                </div>
              </div>
              ${
                groups.length
                  ? `<div class="conversation-list">${groups
                      .map(
                        (group) => `
                          <article class="conversation-item">
                            <a class="conversation-main conversation-link" href="${group.members?.some((member) => member.id === meData.user.id) ? `${routes.group}?id=${group.id}` : routes.groups}">
                              ${avatar(group.name, group.avatar, "avatar large")}
                              <div class="conversation-copy">
                                <div class="conversation-top">
                                <p class="conversation-name">${escapeHtml(group.name)}</p>
                                <span class="time-tag">${escapeHtml(group.subject || "Fan")}</span>
                              </div>
                              <p class="conversation-preview">${escapeHtml(group.description || "Kurs guruhi")}</p>
                              ${
                                group.teacher?.id
                                  ? `<p class="conversation-preview">Ustoz: ${escapeHtml(group.teacher.fullName)}</p>`
                                  : ""
                              }
                            </div>
                            </a>
                            <div class="page-actions">
                              ${profileAction(group.teacher, "Ustoz")}
                            </div>
                          </article>
                        `
                      )
                      .join("")}</div>`
                  : emptyState("Guruh yo'q", "Bu profil uchun hali guruh topilmadi.")
              }
            </section>
            ${
              user.role === "teacher"
                ? `
                  <section class="panel panel-pad">
                    <div class="section-head">
                      <div>
                        <h2 class="section-title">Talabalar</h2>
                        <p class="section-subtitle">${students.length} ta biriktirilgan abituriyent</p>
                      </div>
                    </div>
                    ${
                      students.length
                        ? `<div class="result-list">${students
                            .map(
                              (student) => `
                                <article class="result-item">
                                  <a class="result-main result-link" href="${profileHref(student.id)}">
                                    ${avatar(student.fullName, student.avatar, "avatar")}
                                    <div class="result-copy">
                                      <p class="result-name">${escapeHtml(student.fullName)}</p>
                                      <p class="result-preview">@${escapeHtml(student.username)}</p>
                                    </div>
                                  </a>
                                  <div class="page-actions">
                                    ${profileAction(student, "Profil")}
                                  </div>
                                </article>
                              `
                            )
                            .join("")}</div>`
                        : `<p class="muted-copy">Hali talabalar biriktirilmagan.</p>`
                    }
                  </section>
                `
                : ""
            }
            <section class="panel panel-pad">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Faollik va davomat</h2>
                  <p class="section-subtitle">${user.role === "teacher" ? "O'qituvchi bo'yicha oxirgi davomat kunlari" : "Oxirgi davomat holatlari"}</p>
                </div>
              </div>
              ${
                attendanceFeed.length
                  ? `<div class="profile-feed">${attendanceFeed
                      .map((item) => {
                        const group = groups.find((entry) => entry.id === item.groupId);
                        return `
                          <article class="profile-feed-item">
                            <div>
                              <p class="result-name">${escapeHtml(group?.name || "Guruh")}</p>
                              <p class="result-preview">${escapeHtml(item.date)}</p>
                            </div>
                            <div class="profile-feed-badge ${item.present === false ? "absent" : ""}">
                              ${
                                user.role === "teacher"
                                  ? `${item.presentCount || 0} bor / ${item.absentCount || 0} yo'q`
                                  : item.present
                                    ? "Bor"
                                    : "Yo'q"
                              }
                            </div>
                          </article>
                        `;
                      })
                      .join("")}</div>`
                  : `<p class="muted-copy">Hozircha ko'rsatish uchun faollik yo'q.</p>`
              }
            </section>
          </section>
        </div>
      `,
    });

    document.getElementById("logout-button")?.addEventListener("click", () => {
      clearToken();
      window.location.replace(routes.login);
    });

    document.getElementById("profile-message")?.addEventListener("click", async () => {
      try {
        await startDirectChat(user.id);
      } catch (error) {
        toast(error.message, "error");
      }
    });

    document.getElementById("profile-avatar-input")?.addEventListener("change", (event) => {
      avatarFile = event.target.files[0] || null;
      if (avatarFile) toast(avatarFile.name);
    });

    document.getElementById("profile-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        const uploaded = avatarFile ? await uploadFile(avatarFile, "avatars") : null;
        await api("/api/profile", {
          method: "PUT",
          body: {
            fullName: document.getElementById("profile-name").value,
            username: document.getElementById("profile-username").value,
            phone: document.getElementById("profile-phone").value,
            bio: document.getElementById("profile-bio").value,
            avatar: uploaded ? uploaded.url : user.avatar,
          },
        });
        toast("Profil saqlandi", "success");
        window.setTimeout(() => window.location.reload(), 260);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  async function renderAiPage() {
    clearPolling();
    await loadMe();
    renderPage({
      title: "AI Ustoz",
      subtitle: "Darslar bo'yicha savollar uchun Groq asosidagi yordamchi.",
      actions: profileButton(),
      content: `
        <section class="panel panel-pad stack">
          <div class="field">
            <label for="ai-prompt">Savolingiz</label>
            <textarea class="textarea" id="ai-prompt" placeholder="Masalan: Present Perfect va Past Simple farqi nima?"></textarea>
          </div>
          <button class="button primary" id="ai-send">${icons.send}<span>So'rash</span></button>
          <div class="panel panel-pad">
            <p class="section-subtitle">Javob</p>
            <div id="ai-answer" class="message-text">Savol yuboring.</div>
          </div>
        </section>
      `,
    });
    document.getElementById("ai-send").addEventListener("click", async () => {
      const button = document.getElementById("ai-send");
      const prompt = document.getElementById("ai-prompt").value.trim();
      if (!prompt) return toast("Savol kiriting", "error");
      button.disabled = true;
      try {
        const data = await api("/api/ai/chat", {
          method: "POST",
          body: { prompt },
        });
        document.getElementById("ai-answer").innerHTML = nl2br(data.answer || "Javob yo'q");
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  function adminPageNav(active) {
    const items = [
      { key: "admin", href: routes.admin, label: "Overview" },
      { key: "admin-landing", href: routes.adminLanding, label: "Landing" },
      { key: "admin-users", href: routes.adminUsers, label: "Users" },
      { key: "admin-groups", href: routes.adminGroups, label: "Groups" },
      { key: "admin-content", href: routes.adminContent, label: "Content" },
      { key: "admin-attendance", href: routes.adminAttendance, label: "Attendance" },
      { key: "admin-finance", href: routes.adminFinance, label: "Finance" },
    ];
    return `
      <nav class="admin-tabs">
        ${items
          .map((item) => `<a class="${item.key === active ? "active" : ""}" href="${item.href}">${escapeHtml(item.label)}</a>`)
          .join("")}
      </nav>
    `;
  }

  async function ensureAdminAccess(targetRoute) {
    if (state.adminToken) return true;
    renderAuthLayout({
      title: "Admin boshqaruvi",
      subtitle: "Faqat admin login va parol bilan kiriladi.",
      formTitle: "Admin Login",
      formSubtitle: "Boshqaruvga kirish uchun ma'lumotlarni kiriting.",
      formContent: `
        <form id="admin-login-form-shared" class="auth-form">
          <div class="field">
            <label for="admin-login-shared">Login</label>
            <input class="input" id="admin-login-shared" placeholder="Admin login" required>
          </div>
          <div class="field">
            <label for="admin-password-shared">Parol</label>
            <input class="input" id="admin-password-shared" type="password" placeholder="Admin parol" required>
          </div>
          <button class="button primary block" type="submit">${icons.admin}<span>Kirish</span></button>
        </form>
      `,
    });
    document.getElementById("admin-login-form-shared").addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button");
      button.disabled = true;
      try {
        const data = await api("/api/admin/login", {
          method: "POST",
          body: {
            login: document.getElementById("admin-login-shared").value,
            password: document.getElementById("admin-password-shared").value,
          },
        });
        setAdminToken(data.token);
        window.location.replace(targetRoute);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });
    return false;
  }

  async function renderAdminPage() {
    clearPolling();
    if (!state.adminToken) {
      renderAuthLayout({
        title: "Admin boshqaruv paneli",
        subtitle: "Faqat maxsus login va parol bilan kiriladi.",
        formTitle: "Admin Login",
        formSubtitle: "Env ichidagi admin credential bilan kiring.",
        formContent: `
          <form id="admin-login-form" class="auth-form">
            <div class="field">
              <label for="admin-login">Login</label>
              <input class="input" id="admin-login" placeholder="Admin login" required>
            </div>
            <div class="field">
              <label for="admin-password">Parol</label>
              <input class="input" id="admin-password" type="password" placeholder="Admin parol" required>
            </div>
            <button class="button primary block" type="submit">${icons.admin}<span>Kirish</span></button>
          </form>
        `,
      });
      document.getElementById("admin-login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          const data = await api("/api/admin/login", {
            method: "POST",
            body: {
              login: document.getElementById("admin-login").value,
              password: document.getElementById("admin-password").value,
            },
          });
          setAdminToken(data.token);
          await renderAdminPage();
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });
      return;
    }

    try {
      const [overview, userData, chatData, messageData, announcementData, scheduleData, materialData] = await Promise.all([
        api("/api/admin/overview"),
        api("/api/admin/users"),
        api("/api/admin/chats"),
        api("/api/admin/messages"),
        api("/api/admin/announcements"),
        api("/api/admin/schedules"),
        api("/api/admin/materials"),
      ]);

      renderPage({
        title: "Admin",
        subtitle: "Foydalanuvchi, kurs, jadval, e'lon va materiallar nazorati.",
        actions: `<button class="button danger" id="admin-logout">${icons.logout}<span>Chiqish</span></button>`,
        wide: true,
        content: `
          <section class="stats-grid">
            <article class="stat-card"><strong>${overview.counts.users}</strong><span>Foydalanuvchilar</span></article>
            <article class="stat-card"><strong>${overview.counts.direct}</strong><span>Direct chatlar</span></article>
            <article class="stat-card"><strong>${overview.counts.group}</strong><span>Guruhlar</span></article>
            <article class="stat-card"><strong>${overview.counts.messages}</strong><span>Xabarlar</span></article>
          </section>
          <section class="stats-grid">
            <article class="stat-card"><strong>${overview.counts.calls}</strong><span>Faol video call</span></article>
            <article class="stat-card"><strong>${overview.counts.teachers || 0}</strong><span>O'qituvchilar</span></article>
            <article class="stat-card"><strong>${overview.counts.abituriyent || 0}</strong><span>Abituriyentlar</span></article>
            <article class="stat-card"><strong>${overview.counts.attendance || 0}</strong><span>Davomat yozuvlari</span></article>
          </section>
          <section class="stats-grid">
            <article class="stat-card"><strong>${overview.counts.announcements || 0}</strong><span>E'lonlar</span></article>
            <article class="stat-card"><strong>${overview.counts.schedules || 0}</strong><span>Jadval yozuvlari</span></article>
            <article class="stat-card"><strong>${overview.counts.materials || 0}</strong><span>Material/vazifa</span></article>
            <article class="stat-card"><strong>${messageData.messages.length}</strong><span>So'nggi xabarlar</span></article>
          </section>
          <div class="split-layout">
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Yangi foydalanuvchi</h2>
                  <p class="section-subtitle">Userlar faqat admin tomonidan yaratiladi.</p>
                </div>
              </div>
              <details class="toggle-panel">
                <summary>Foydalanuvchi qo'shish formasini ochish</summary>
                <div class="toggle-body">
              <form id="admin-create-user" class="stack">
                <div class="grid-2">
                  <div class="field"><label>To'liq ism</label><input class="input" id="create-user-name" required></div>
                  <div class="field"><label>Username</label><input class="input" id="create-user-username" required></div>
                </div>
                <div class="grid-2">
                  <div class="field"><label>Telefon</label><input class="input" id="create-user-phone" placeholder="+998..."></div>
                  <div class="field"><label>Parol</label><input class="input" id="create-user-password" type="password" required></div>
                </div>
                <div class="field">
                  <label>Role</label>
                  <select class="input" id="create-user-role">
                    <option value="abituriyent">abituriyent</option>
                    <option value="teacher">teacher</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div class="field">
                  <label>Biriktiriladigan o'qituvchi (abituriyent uchun)</label>
                  <select class="input" id="create-user-teacher">
                    <option value="">Tanlanmagan</option>
                    ${(userData.users || [])
                      .filter((user) => user.role === "teacher")
                      .map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.fullName)}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="field">
                  <label>Biriktiriladigan guruh (abituriyent uchun)</label>
                  <select class="input" id="create-user-group">
                    <option value="">Tanlanmagan</option>
                    ${(chatData.chats || [])
                      .filter((chat) => chat.type === "group")
                      .map((group) => `<option value="${group.id}">${escapeHtml(group.name)}${group.subject ? ` (${escapeHtml(group.subject)})` : ""}</option>`)
                      .join("")}
                  </select>
                </div>
                <button class="button primary" type="submit">${icons.plus}<span>Foydalanuvchi qo'shish</span></button>
              </form>
                </div>
              </details>
            </section>
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Yangi guruh</h2>
                  <p class="section-subtitle">Fan va o'qituvchi biriktirib kurs guruhi yarating.</p>
                </div>
              </div>
              <details class="toggle-panel">
                <summary>Guruh yaratish formasini ochish</summary>
                <div class="toggle-body">
              <form id="admin-create-group" class="stack">
                <div class="field"><label>Guruh nomi</label><input class="input" id="create-group-name" placeholder="INGLIZ TILI" required></div>
                <div class="field"><label>Fan</label><input class="input" id="create-group-subject" placeholder="English Grammar" required></div>
                <div class="field"><label>Tavsif</label><input class="input" id="create-group-description"></div>
                <div class="field"><label>Avatar URL</label><input class="input" id="create-group-avatar" placeholder="https://..."></div>
                <div class="field">
                  <label>O'qituvchi</label>
                  <select class="input" id="create-group-teacher">
                    ${(userData.users || [])
                      .filter((user) => user.role === "teacher")
                      .map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.fullName)} (@${escapeHtml(teacher.username)})</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="field">
                  <label>Abituriyentlar</label>
                  <div class="member-list">
                    ${(userData.users || [])
                      .filter((user) => user.role === "abituriyent")
                      .map(
                        (student) => `
                          <label class="member-option">
                            <input type="checkbox" value="${student.id}" name="admin-students">
                            ${avatar(student.fullName, student.avatar, "avatar small")}
                            <span>${escapeHtml(student.fullName)}</span>
                          </label>
                        `
                      )
                      .join("")}
                  </div>
                </div>
                <button class="button primary" type="submit">${icons.groups}<span>Guruh yaratish</span></button>
              </form>
                </div>
              </details>
            </section>
          </div>
          <div class="split-layout">
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">E'lon qo'shish</h2>
                  <p class="section-subtitle">Umumiy yoki ma'lum guruh uchun muhim xabar yozing.</p>
                </div>
              </div>
              <form id="admin-create-announcement" class="stack">
                <div class="field">
                  <label>Qaysi guruh uchun</label>
                  <select class="input" id="create-announcement-group">
                    <option value="">Barcha foydalanuvchilar uchun</option>
                    ${(chatData.chats || [])
                      .filter((chat) => chat.type === "group")
                      .map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="field"><label>Sarlavha</label><input class="input" id="create-announcement-title" required></div>
                <div class="field"><label>Matn</label><textarea class="textarea" id="create-announcement-body" placeholder="Muhim xabar..."></textarea></div>
                <label class="member-option">
                  <input type="checkbox" id="create-announcement-pinned">
                  <span>Muhim qilib tepaga chiqarilsin</span>
                </label>
                <button class="button primary" type="submit">${icons.bell}<span>E'lon joylash</span></button>
              </form>
            </section>
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Dars jadvali</h2>
                  <p class="section-subtitle">Kurslar uchun haftalik vaqtlarni belgilang.</p>
                </div>
              </div>
              <form id="admin-create-schedule" class="stack">
                <div class="field">
                  <label>Guruh</label>
                  <select class="input" id="create-schedule-group">
                    ${(chatData.chats || [])
                      .filter((chat) => chat.type === "group")
                      .map((group) => `<option value="${group.id}">${escapeHtml(group.name)}${group.subject ? ` (${escapeHtml(group.subject)})` : ""}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="grid-2">
                  <div class="field">
                    <label>Hafta kuni</label>
                    <select class="input" id="create-schedule-day">
                      <option value="1">Dushanba</option>
                      <option value="2">Seshanba</option>
                      <option value="3">Chorshanba</option>
                      <option value="4">Payshanba</option>
                      <option value="5">Juma</option>
                      <option value="6">Shanba</option>
                      <option value="0">Yakshanba</option>
                    </select>
                  </div>
                  <div class="field">
                    <label>Xona</label>
                    <input class="input" id="create-schedule-room" placeholder="Xona 2">
                  </div>
                </div>
                <div class="grid-2">
                  <div class="field"><label>Boshlanish</label><input class="input" id="create-schedule-start" type="time" value="09:00"></div>
                  <div class="field"><label>Tugash</label><input class="input" id="create-schedule-end" type="time" value="10:30"></div>
                </div>
                <div class="field"><label>Izoh</label><input class="input" id="create-schedule-note" placeholder="Speaking practice"></div>
                <button class="button primary" type="submit">${icons.calendar}<span>Jadval qo'shish</span></button>
              </form>
            </section>
          </div>
          <section class="panel panel-pad stack">
            <div class="section-head">
              <div>
                <h2 class="section-title">Material yoki vazifa</h2>
                <p class="section-subtitle">Admin ham guruh uchun topshiriq va dars materiallarini qo'sha oladi.</p>
              </div>
            </div>
            <form id="admin-create-material" class="stack">
              <div class="grid-2">
                <div class="field">
                  <label>Guruh</label>
                  <select class="input" id="create-material-group">
                    ${(chatData.chats || [])
                      .filter((chat) => chat.type === "group")
                      .map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="field">
                  <label>Turi</label>
                  <select class="input" id="create-material-type">
                    <option value="material">Material</option>
                    <option value="homework">Vazifa</option>
                    <option value="lesson">Dars qaydi</option>
                  </select>
                </div>
              </div>
              <div class="grid-2">
                <div class="field"><label>Nomi</label><input class="input" id="create-material-title" required></div>
                <div class="field"><label>Deadline</label><input class="input" id="create-material-date" type="date"></div>
              </div>
              <div class="field"><label>Havola</label><input class="input" id="create-material-link" placeholder="https://..."></div>
              <div class="field"><label>Izoh</label><textarea class="textarea" id="create-material-description" placeholder="Mavzu, topshiriq yoki fayl havolasi..."></textarea></div>
              <button class="button primary" type="submit">${icons.book}<span>Material qo'shish</span></button>
            </form>
          </section>
          <div class="split-layout">
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Foydalanuvchilar</h2>
                  <p class="section-subtitle">Delete va role update qilish mumkin.</p>
                </div>
              </div>
              <div class="field">
                <input class="input" id="admin-user-search" placeholder="User qidirish...">
              </div>
              <div class="result-list" id="admin-users-list">
                ${userData.users
                  .map(
                    (user) => `
                      <article class="result-item">
                        <div class="result-main">
                          ${avatar(user.fullName, user.avatar, "avatar")}
                          <div class="result-copy">
                            <p class="result-name">${escapeHtml(user.fullName)}</p>
                            <p class="result-preview">@${escapeHtml(user.username)} ${user.phone ? "• " + escapeHtml(user.phone) : ""}</p>
                          </div>
                        </div>
                        <div class="page-actions">
                          <button
                            class="button secondary icon-only"
                            data-admin-edit-user="${user.id}"
                            data-name="${escapeHtml(user.fullName || "")}"
                            data-username="${escapeHtml(user.username || "")}"
                            data-phone="${escapeHtml(user.phone || "")}"
                            data-bio="${escapeHtml(user.bio || "")}"
                            aria-label="User tahrirlash"
                            title="User tahrirlash"
                          >${icons.edit}<span>Edit</span></button>
                          <button class="button secondary icon-only" data-admin-role="${user.id}" aria-label="Role almashtirish" title="Role almashtirish">${icons.admin}<span>Role</span></button>
                          <button class="button danger icon-only" data-admin-delete-user="${user.id}" aria-label="Delete user" title="Delete user">${icons.trash}<span>Delete</span></button>
                        </div>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Chat va guruhlar</h2>
                  <p class="section-subtitle">Hammasini ko'rish va o'chirish mumkin.</p>
                </div>
              </div>
              <div class="field">
                <input class="input" id="admin-chat-search" placeholder="Chat yoki group qidirish...">
              </div>
              <div class="result-list" id="admin-chats-list">
                ${chatData.chats
                  .map(
                    (chat) => `
                      <article class="result-item">
                        <div class="result-main">
                          ${avatar(chat.name, chat.avatar, "avatar")}
                          <div class="result-copy">
                            <p class="result-name">${escapeHtml(chat.name)}</p>
                            <p class="result-preview">${escapeHtml(chat.type)} • ${escapeHtml(String(chat.memberCount))} a'zo</p>
                          </div>
                        </div>
                        <div class="page-actions">
                          ${
                            chat.type === "group"
                              ? `<button class="button secondary icon-only" data-admin-attendance="${chat.id}" aria-label="Davomat" title="Davomat">${icons.groups}<span>Attendance</span></button>`
                              : ""
                          }
                          <button
                            class="button secondary icon-only"
                            data-admin-edit-chat="${chat.id}"
                            data-name="${escapeHtml(chat.name || "")}"
                            data-description="${escapeHtml(chat.description || "")}"
                            aria-label="Chat tahrirlash"
                            title="Chat tahrirlash"
                          >${icons.edit}<span>Edit</span></button>
                          <button class="button danger icon-only" data-admin-delete-chat="${chat.id}" aria-label="Delete chat" title="Delete chat">${icons.trash}<span>Delete</span></button>
                        </div>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          </div>
          <section class="panel panel-pad stack">
            <div class="section-head">
              <div>
                <h2 class="section-title">Davomat nazorati</h2>
                <p class="section-subtitle">Guruh davomatini admin panel ichida ko'rish mumkin.</p>
              </div>
            </div>
            <div id="admin-attendance-view">${emptyState("Davomat tanlanmagan", "Guruh kartasidagi davomat tugmasini bosing.")}</div>
          </section>
          <div class="split-layout">
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">E'lonlar lentasi</h2>
                  <p class="section-subtitle">${announcementData.announcements.length} ta yozuv</p>
                </div>
              </div>
              <div class="result-list" id="admin-announcements-list">
                ${announcementData.announcements.length
                  ? announcementData.announcements
                      .map(
                        (item) => `
                          <article class="result-item">
                            <div class="result-main">
                              <div class="result-copy">
                                <p class="result-name">${escapeHtml(item.title)}</p>
                                <p class="result-preview">${escapeHtml(item.body)}</p>
                                <p class="result-preview">${escapeHtml(item.group?.name || "Barcha foydalanuvchilar")} • ${escapeHtml(item.authorName || "Admin")}</p>
                              </div>
                            </div>
                            <div class="page-actions">
                              <button class="button danger icon-only" data-admin-delete-announcement="${item.id}" aria-label="Delete announcement" title="Delete announcement">${icons.trash}<span>Delete</span></button>
                            </div>
                          </article>
                        `
                      )
                      .join("")
                  : emptyState("E'lon yo'q", "Birinchi e'lonni tepada qo'shing.")}
              </div>
            </section>
            <section class="panel panel-pad stack">
              <div class="section-head">
                <div>
                  <h2 class="section-title">Dars jadvali</h2>
                  <p class="section-subtitle">${scheduleData.schedules.length} ta yozuv</p>
                </div>
              </div>
              <div class="result-list" id="admin-schedules-list">
                ${scheduleData.schedules.length
                  ? scheduleData.schedules
                      .map(
                        (item) => `
                          <article class="result-item">
                            <div class="result-main">
                              <div class="result-copy">
                                <p class="result-name">${escapeHtml(item.group?.name || "Guruh")} • ${escapeHtml(weekdayLabel(item.dayOfWeek))}</p>
                                <p class="result-preview">${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)} ${item.room ? `• ${escapeHtml(item.room)}` : ""}</p>
                                <p class="result-preview">${escapeHtml(item.note || "Izoh yo'q")}</p>
                              </div>
                            </div>
                            <div class="page-actions">
                              <button class="button danger icon-only" data-admin-delete-schedule="${item.id}" aria-label="Delete schedule" title="Delete schedule">${icons.trash}<span>Delete</span></button>
                            </div>
                          </article>
                        `
                      )
                      .join("")
                  : emptyState("Jadval yo'q", "Dars vaqtlarini tepada qo'shing.")}
              </div>
            </section>
          </div>
          <section class="panel panel-pad stack">
            <div class="section-head">
              <div>
                <h2 class="section-title">Material va vazifalar</h2>
                <p class="section-subtitle">${materialData.materials.length} ta yozuv</p>
              </div>
            </div>
            <div class="result-list" id="admin-materials-list">
              ${materialData.materials.length
                ? materialData.materials
                    .map(
                      (item) => `
                        <article class="result-item">
                          <div class="result-main">
                            <div class="result-copy">
                              <p class="result-name">${escapeHtml(item.title)} • ${escapeHtml(materialTypeLabel(item.type))}</p>
                              <p class="result-preview">${escapeHtml(item.group?.name || "Guruh")} ${item.dueDate ? `• ${escapeHtml(item.dueDate)}` : ""}</p>
                              <p class="result-preview">${escapeHtml(item.description)}</p>
                            </div>
                          </div>
                          <div class="page-actions">
                            <button class="button danger icon-only" data-admin-delete-material="${item.id}" aria-label="Delete material" title="Delete material">${icons.trash}<span>Delete</span></button>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : emptyState("Material yo'q", "Material yoki vazifani tepada qo'shing.")}
            </div>
          </section>
          <section class="panel panel-pad stack">
            <div class="section-head">
              <div>
                <h2 class="section-title">Xabarlar</h2>
                <p class="section-subtitle">Xabarlarni ko'rish va o'chirish mumkin.</p>
              </div>
            </div>
            <div class="field">
              <input class="input" id="admin-message-search" placeholder="Xabar bo'yicha qidirish...">
            </div>
            <div class="result-list" id="admin-messages-list">
              ${messageData.messages
                .map(
                  (message) => `
                    <article class="result-item">
                      <div class="result-main">
                        ${avatar(message.sender?.fullName || "User", message.sender?.avatar, "avatar")}
                        <div class="result-copy">
                          <p class="result-name">${escapeHtml(message.sender?.fullName || "User")} • ${escapeHtml(message.chatName || "Chat")}</p>
                          <p class="result-preview">${escapeHtml(message.text || (message.mediaUrl ? "Rasm/video media" : "Bo'sh xabar"))}</p>
                        </div>
                      </div>
                      <div class="page-actions">
                        <button class="button danger icon-only" data-admin-delete-message="${message.id}" aria-label="Delete message" title="Delete message">${icons.trash}<span>Delete</span></button>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>
          </section>
        `,
      });

      document.getElementById("admin-logout").addEventListener("click", () => {
        clearAdminToken();
        renderAdminPage();
      });

      document.getElementById("admin-create-user").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          await api("/api/admin/users", {
            method: "POST",
            body: {
              fullName: document.getElementById("create-user-name").value,
              username: document.getElementById("create-user-username").value,
              phone: document.getElementById("create-user-phone").value,
              password: document.getElementById("create-user-password").value,
              role: document.getElementById("create-user-role").value,
              teacherId: document.getElementById("create-user-teacher").value,
              groupId: document.getElementById("create-user-group").value,
            },
          });
          toast("Foydalanuvchi qo'shildi", "success");
          await renderAdminPage();
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById("admin-create-group").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          const studentIds = Array.from(document.querySelectorAll("input[name='admin-students']:checked")).map((input) => input.value);
          await api("/api/admin/groups", {
            method: "POST",
            body: {
              name: document.getElementById("create-group-name").value,
              subject: document.getElementById("create-group-subject").value,
              description: document.getElementById("create-group-description").value,
              avatar: document.getElementById("create-group-avatar").value,
              teacherId: document.getElementById("create-group-teacher").value,
              studentIds,
            },
          });
          toast("Guruh yaratildi", "success");
          await renderAdminPage();
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById("admin-create-announcement").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          await api("/api/admin/announcements", {
            method: "POST",
            body: {
              groupId: document.getElementById("create-announcement-group").value,
              title: document.getElementById("create-announcement-title").value,
              body: document.getElementById("create-announcement-body").value,
              pinned: document.getElementById("create-announcement-pinned").checked,
            },
          });
          toast("E'lon qo'shildi", "success");
          await renderAdminPage();
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById("admin-create-schedule").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          await api("/api/admin/schedules", {
            method: "POST",
            body: {
              groupId: document.getElementById("create-schedule-group").value,
              dayOfWeek: document.getElementById("create-schedule-day").value,
              room: document.getElementById("create-schedule-room").value,
              startTime: document.getElementById("create-schedule-start").value,
              endTime: document.getElementById("create-schedule-end").value,
              note: document.getElementById("create-schedule-note").value,
            },
          });
          toast("Jadval qo'shildi", "success");
          await renderAdminPage();
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById("admin-create-material").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          await api("/api/admin/materials", {
            method: "POST",
            body: {
              groupId: document.getElementById("create-material-group").value,
              type: document.getElementById("create-material-type").value,
              title: document.getElementById("create-material-title").value,
              dueDate: document.getElementById("create-material-date").value,
              link: document.getElementById("create-material-link").value,
              description: document.getElementById("create-material-description").value,
            },
          });
          toast("Material qo'shildi", "success");
          await renderAdminPage();
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });

      async function refreshUsers(query = "") {
        const data = await api(`/api/admin/users?q=${encodeURIComponent(query)}`);
        document.getElementById("admin-users-list").innerHTML = data.users
          .map(
            (user) => `
              <article class="result-item">
                <div class="result-main">
                  ${avatar(user.fullName, user.avatar, "avatar")}
                  <div class="result-copy">
                    <p class="result-name">${escapeHtml(user.fullName)}</p>
                    <p class="result-preview">@${escapeHtml(user.username)} ${user.phone ? "• " + escapeHtml(user.phone) : ""}</p>
                  </div>
                </div>
                <div class="page-actions">
                  <button
                    class="button secondary icon-only"
                    data-admin-edit-user="${user.id}"
                    data-name="${escapeHtml(user.fullName || "")}"
                    data-username="${escapeHtml(user.username || "")}"
                    data-phone="${escapeHtml(user.phone || "")}"
                    data-bio="${escapeHtml(user.bio || "")}"
                    aria-label="User tahrirlash"
                    title="User tahrirlash"
                  >${icons.edit}<span>Edit</span></button>
                  <button class="button secondary icon-only" data-admin-role="${user.id}" aria-label="Role almashtirish" title="Role almashtirish">${icons.admin}<span>Role</span></button>
                  <button class="button danger icon-only" data-admin-delete-user="${user.id}" aria-label="Delete user" title="Delete user">${icons.trash}<span>Delete</span></button>
                </div>
              </article>
            `
          )
          .join("");
        bindAdminActions();
      }

      async function refreshChats(query = "") {
        const data = await api(`/api/admin/chats?q=${encodeURIComponent(query)}`);
        document.getElementById("admin-chats-list").innerHTML = data.chats
          .map(
            (chat) => `
              <article class="result-item">
                <div class="result-main">
                  ${avatar(chat.name, chat.avatar, "avatar")}
                  <div class="result-copy">
                    <p class="result-name">${escapeHtml(chat.name)}</p>
                    <p class="result-preview">${escapeHtml(chat.type)} • ${escapeHtml(String(chat.memberCount))} a'zo</p>
                  </div>
                </div>
                <div class="page-actions">
                  ${
                    chat.type === "group"
                      ? `<button class="button secondary icon-only" data-admin-attendance="${chat.id}" aria-label="Davomat" title="Davomat">${icons.groups}<span>Attendance</span></button>`
                      : ""
                  }
                  <button
                    class="button secondary icon-only"
                    data-admin-edit-chat="${chat.id}"
                    data-name="${escapeHtml(chat.name || "")}"
                    data-description="${escapeHtml(chat.description || "")}"
                    aria-label="Chat tahrirlash"
                    title="Chat tahrirlash"
                  >${icons.edit}<span>Edit</span></button>
                  <button class="button danger icon-only" data-admin-delete-chat="${chat.id}" aria-label="Delete chat" title="Delete chat">${icons.trash}<span>Delete</span></button>
                </div>
              </article>
            `
          )
          .join("");
        bindAdminActions();
      }

      async function refreshMessages(query = "") {
        const data = await api(`/api/admin/messages?q=${encodeURIComponent(query)}`);
        document.getElementById("admin-messages-list").innerHTML = data.messages
          .map(
            (message) => `
              <article class="result-item">
                <div class="result-main">
                  ${avatar(message.sender?.fullName || "User", message.sender?.avatar, "avatar")}
                  <div class="result-copy">
                    <p class="result-name">${escapeHtml(message.sender?.fullName || "User")} • ${escapeHtml(message.chatName || "Chat")}</p>
                    <p class="result-preview">${escapeHtml(message.text || (message.mediaUrl ? "Media xabar" : "Bo'sh xabar"))}</p>
                  </div>
                </div>
                <div class="page-actions">
                  <button class="button danger icon-only" data-admin-delete-message="${message.id}" aria-label="Delete message" title="Delete message">${icons.trash}<span>Delete</span></button>
                </div>
              </article>
            `
          )
          .join("");
        bindAdminActions();
      }

      function bindAdminActions() {
        document.querySelectorAll("[data-admin-edit-user]").forEach((button) => {
          button.onclick = async () => {
            const fullName = window.prompt("To'liq ism", button.dataset.name || "");
            if (fullName === null) return;
            const username = window.prompt("Username", button.dataset.username || "");
            if (username === null) return;
            const phone = window.prompt("Telefon", button.dataset.phone || "");
            if (phone === null) return;
            const bio = window.prompt("Bio", button.dataset.bio || "");
            if (bio === null) return;
            await api(`/api/admin/users/${button.dataset.adminEditUser}`, {
              method: "PATCH",
              body: { fullName, username, phone, bio },
            });
            toast("User yangilandi", "success");
            await refreshUsers(document.getElementById("admin-user-search").value);
          };
        });

        document.querySelectorAll("[data-admin-delete-user]").forEach((button) => {
          button.onclick = async () => {
            if (!window.confirm("User o'chirilsinmi?")) return;
            await api(`/api/admin/users/${button.dataset.adminDeleteUser}`, { method: "DELETE" });
            toast("User o'chirildi", "success");
            await refreshUsers(document.getElementById("admin-user-search").value);
          };
        });

        document.querySelectorAll("[data-admin-role]").forEach((button) => {
          button.onclick = async () => {
            const role = window.prompt("Yangi role yozing: admin, teacher yoki abituriyent", "abituriyent");
            if (!role) return;
            await api(`/api/admin/users/${button.dataset.adminRole}`, {
              method: "PATCH",
              body: { role },
            });
            toast("Role yangilandi", "success");
            await refreshUsers(document.getElementById("admin-user-search").value);
          };
        });

        document.querySelectorAll("[data-admin-delete-chat]").forEach((button) => {
          button.onclick = async () => {
            if (!window.confirm("Chat yoki guruh o'chirilsinmi?")) return;
            await api(`/api/admin/chats/${button.dataset.adminDeleteChat}`, { method: "DELETE" });
            toast("Chat o'chirildi", "success");
            await refreshChats(document.getElementById("admin-chat-search").value);
          };
        });

        document.querySelectorAll("[data-admin-attendance]").forEach((button) => {
          button.onclick = async () => {
            const data = await api(`/api/admin/groups/${button.dataset.adminAttendance}/attendance`);
            const rows = data.attendance || [];
            document.getElementById("admin-attendance-view").innerHTML = rows.length
              ? `<div class="result-list">${rows
                  .map(
                    (item) => `
                      <article class="result-item">
                        <div class="result-main">
                          <div class="result-copy">
                            <p class="result-name">${escapeHtml(item.date)}</p>
                            <p class="result-preview">${(item.records || [])
                              .map((row) => `${escapeHtml(row.student?.fullName || "Talaba")}: ${row.present ? "Bor" : "Yo'q"}`)
                              .join(" | ")}</p>
                          </div>
                        </div>
                      </article>
                    `
                  )
                  .join("")}</div>`
              : emptyState("Davomat topilmadi", "Bu guruh uchun hali davomat kiritilmagan.");
          };
        });

        document.querySelectorAll("[data-admin-edit-chat]").forEach((button) => {
          button.onclick = async () => {
            const name = window.prompt("Chat nomi", button.dataset.name || "");
            if (name === null) return;
            const description = window.prompt("Izoh", button.dataset.description || "");
            if (description === null) return;
            await api(`/api/admin/chats/${button.dataset.adminEditChat}`, {
              method: "PATCH",
              body: { name, description },
            });
            toast("Chat yangilandi", "success");
            await refreshChats(document.getElementById("admin-chat-search").value);
          };
        });

        document.querySelectorAll("[data-admin-delete-message]").forEach((button) => {
          button.onclick = async () => {
            if (!window.confirm("Xabar o'chirilsinmi?")) return;
            await api(`/api/admin/messages/${button.dataset.adminDeleteMessage}`, { method: "DELETE" });
            toast("Xabar o'chirildi", "success");
            await refreshMessages(document.getElementById("admin-message-search").value);
          };
        });

        document.querySelectorAll("[data-admin-delete-announcement]").forEach((button) => {
          button.onclick = async () => {
            if (!window.confirm("E'lon o'chirilsinmi?")) return;
            await api(`/api/admin/announcements/${button.dataset.adminDeleteAnnouncement}`, { method: "DELETE" });
            toast("E'lon o'chirildi", "success");
            await renderAdminPage();
          };
        });

        document.querySelectorAll("[data-admin-delete-schedule]").forEach((button) => {
          button.onclick = async () => {
            if (!window.confirm("Jadval yozuvi o'chirilsinmi?")) return;
            await api(`/api/admin/schedules/${button.dataset.adminDeleteSchedule}`, { method: "DELETE" });
            toast("Jadval o'chirildi", "success");
            await renderAdminPage();
          };
        });

        document.querySelectorAll("[data-admin-delete-material]").forEach((button) => {
          button.onclick = async () => {
            if (!window.confirm("Material yoki vazifa o'chirilsinmi?")) return;
            await api(`/api/admin/materials/${button.dataset.adminDeleteMaterial}`, { method: "DELETE" });
            toast("Material o'chirildi", "success");
            await renderAdminPage();
          };
        });
      }

      bindAdminActions();

      let timerUsers = 0;
      let timerChats = 0;
      let timerMessages = 0;
      document.getElementById("admin-user-search").oninput = (event) => {
        clearTimeout(timerUsers);
        timerUsers = setTimeout(() => refreshUsers(event.target.value.trim()), 250);
      };
      document.getElementById("admin-chat-search").oninput = (event) => {
        clearTimeout(timerChats);
        timerChats = setTimeout(() => refreshChats(event.target.value.trim()), 250);
      };
      document.getElementById("admin-message-search").oninput = (event) => {
        clearTimeout(timerMessages);
        timerMessages = setTimeout(() => refreshMessages(event.target.value.trim()), 250);
      };
    } catch (error) {
      clearAdminToken();
      toast(error.message, "error");
      await renderAdminPage();
    }
  }

  async function renderAdminOverviewPage() {
    clearPolling();
    if (!(await ensureAdminAccess(routes.admin))) return;
    const overview = await api("/api/admin/overview");
    renderPage({
      title: "Admin Overview",
      subtitle: "Boshqaruv modullari alohida sahifalarga bo'lindi.",
      actions: `<button class="button danger" id="admin-logout-overview">${icons.logout}<span>Chiqish</span></button>`,
      wide: true,
      content: `
        ${adminPageNav("admin")}
        <section class="stats-grid">
          <article class="stat-card"><strong>${overview.counts.users || 0}</strong><span>Foydalanuvchilar</span></article>
          <article class="stat-card"><strong>${overview.counts.group || 0}</strong><span>Guruhlar</span></article>
          <article class="stat-card"><strong>${overview.counts.messages || 0}</strong><span>Xabarlar</span></article>
          <article class="stat-card"><strong>${overview.counts.attendance || 0}</strong><span>Davomat</span></article>
          <article class="stat-card"><strong>${overview.counts.studentPayments || 0}</strong><span>To'lov yozuvlari</span></article>
          <article class="stat-card"><strong>${overview.counts.financeExpenses || 0}</strong><span>Xarajat yozuvlari</span></article>
        </section>
        <section class="module-grid panel panel-pad">
          ${moduleTile("home", routes.adminLanding, "Landing", "Asosiy saytni tahrirlash")}
          ${moduleTile("profile", routes.adminUsers, "Users", "Yaratish, roli va tahrirlash")}
          ${moduleTile("groups", routes.adminGroups, "Groups", "Kurs guruhlarini boshqarish")}
          ${moduleTile("book", routes.adminContent, "Content", "E'lon, jadval, material")}
          ${moduleTile("attendance", routes.adminAttendance, "Attendance", "Davomat tarix nazorati")}
          ${moduleTile("money", routes.adminFinance, "Finance", "To'lov, maosh, xarajat CRM")}
        </section>
      `,
    });
    document.getElementById("admin-logout-overview").addEventListener("click", () => {
      clearAdminToken();
      window.location.reload();
    });
  }

  async function renderAdminLandingPage() {
    clearPolling();
    if (!(await ensureAdminAccess(routes.adminLanding))) return;
    const siteData = await api("/api/admin/site-content");
    const site = siteData.site || {};
    renderPage({
      title: "Admin Landing",
      subtitle: "Landing page kontentini shu sahifadan boshqaring.",
      actions: `<button class="button danger" id="admin-logout-landing">${icons.logout}<span>Chiqish</span></button>`,
      wide: true,
      content: `
        ${adminPageNav("admin-landing")}
        <section class="panel panel-pad stack">
          <h2 class="section-title">Landing page sozlamalari</h2>
          <p class="section-subtitle">Logo, favicon, hero, kurslar va galereyani to'liq tahrirlash.</p>
          <form id="al-site-form" class="stack">
            <div class="grid-2">
              <div class="field"><label>Brend nomi</label><input class="input" id="al-site-brand" value="${escapeHtml(site.brandName || "Cliffs")}"></div>
              <div class="field"><label>Tagline</label><input class="input" id="al-site-tagline" value="${escapeHtml(site.brandTagline || "")}"></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Logo URL</label><input class="input" id="al-site-logo" value="${escapeHtml(site.logoUrl || "")}" placeholder="https://..."></div>
              <div class="field"><label>Favicon URL</label><input class="input" id="al-site-favicon" value="${escapeHtml(site.faviconUrl || "")}" placeholder="https://..."></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Logo fayli</label><input class="input" id="al-site-logo-file" type="file" accept="image/*"></div>
              <div class="field"><label>Favicon fayli</label><input class="input" id="al-site-favicon-file" type="file" accept="image/*"></div>
            </div>
            <div class="field"><label>Hero sarlavha</label><input class="input" id="al-site-hero-title" value="${escapeHtml(site.heroTitle || "")}"></div>
            <div class="field"><label>Hero matni</label><textarea class="textarea" id="al-site-hero-subtitle">${escapeHtml(site.heroSubtitle || "")}</textarea></div>
            <div class="field"><label>Hero rasm URL</label><input class="input" id="al-site-hero-image" value="${escapeHtml(site.heroImage || "")}" placeholder="https://..."></div>
            <div class="field"><label>Hero rasm fayli</label><input class="input" id="al-site-hero-file" type="file" accept="image/*"></div>
            <div class="grid-2">
              <div class="field"><label>Telefon</label><input class="input" id="al-site-phone" value="${escapeHtml(site.phone || "")}"></div>
              <div class="field"><label>Telegram link</label><input class="input" id="al-site-telegram" value="${escapeHtml(site.telegram || "")}" placeholder="https://t.me/..."></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Manzil</label><input class="input" id="al-site-address" value="${escapeHtml(site.address || "")}"></div>
              <div class="field"><label>Ish vaqti</label><input class="input" id="al-site-hours" value="${escapeHtml(site.workingHours || "")}"></div>
            </div>
            <div class="field"><label>Kurslar (har qatorga bittadan)</label><textarea class="textarea" id="al-site-courses">${escapeHtml((site.courses || []).join("\n"))}</textarea></div>
            <div class="field"><label>Galereya rasmlari URL (har qatorga bittadan)</label><textarea class="textarea" id="al-site-gallery">${escapeHtml((site.gallery || []).join("\n"))}</textarea></div>
            <div class="field"><label>Galereya fayllari</label><input class="input" id="al-site-gallery-files" type="file" accept="image/*" multiple></div>
            <button class="button primary" type="submit">${icons.edit}<span>Landingni saqlash</span></button>
          </form>
        </section>
      `,
    });

    document.getElementById("admin-logout-landing").onclick = () => {
      clearAdminToken();
      window.location.reload();
    };

    document.getElementById("al-site-form").onsubmit = async (event) => {
      event.preventDefault();
      const submitButton = event.currentTarget.querySelector("button[type='submit']");
      submitButton.disabled = true;
      const payload = {
        brandName: document.getElementById("al-site-brand").value,
        brandTagline: document.getElementById("al-site-tagline").value,
        logoUrl: document.getElementById("al-site-logo").value,
        faviconUrl: document.getElementById("al-site-favicon").value,
        heroTitle: document.getElementById("al-site-hero-title").value,
        heroSubtitle: document.getElementById("al-site-hero-subtitle").value,
        heroImage: document.getElementById("al-site-hero-image").value,
        phone: document.getElementById("al-site-phone").value,
        telegram: document.getElementById("al-site-telegram").value,
        address: document.getElementById("al-site-address").value,
        workingHours: document.getElementById("al-site-hours").value,
        courses: document
          .getElementById("al-site-courses")
          .value.split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
        gallery: document
          .getElementById("al-site-gallery")
          .value.split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
      };
      try {
        const logoFile = document.getElementById("al-site-logo-file").files?.[0] || null;
        const faviconFile = document.getElementById("al-site-favicon-file").files?.[0] || null;
        const heroFile = document.getElementById("al-site-hero-file").files?.[0] || null;
        const galleryFiles = Array.from(document.getElementById("al-site-gallery-files").files || []);

        if (logoFile) {
          const uploaded = await uploadFile(logoFile, "landing", true);
          payload.logoUrl = uploaded?.url || payload.logoUrl;
        }
        if (faviconFile) {
          const uploaded = await uploadFile(faviconFile, "landing", true);
          payload.faviconUrl = uploaded?.url || payload.faviconUrl;
        }
        if (heroFile) {
          const uploaded = await uploadFile(heroFile, "landing", true);
          payload.heroImage = uploaded?.url || payload.heroImage;
        }
        if (galleryFiles.length) {
          for (const file of galleryFiles) {
            const uploaded = await uploadFile(file, "landing", true);
            if (uploaded?.url) payload.gallery.push(uploaded.url);
          }
        }

        await api("/api/admin/site-content", {
          method: "PUT",
          body: payload,
        });
        state.site = null;
        await loadSiteContent();
        toast("Landing sozlamalari saqlandi", "success");
        await renderAdminLandingPage();
      } catch (error) {
        toast(error.message, "error");
      } finally {
        submitButton.disabled = false;
      }
    };
  }

  async function renderAdminUsersPage() {
    clearPolling();
    if (!(await ensureAdminAccess(routes.adminUsers))) return;
    const [userData, chatData] = await Promise.all([api("/api/admin/users"), api("/api/admin/chats?type=group")]);
    const teachers = (userData.users || []).filter((user) => user.role === "teacher");
    const groups = (chatData.chats || []).filter((chat) => chat.type === "group");

    renderPage({
      title: "Admin Users",
      subtitle: "Foydalanuvchi yaratish va rollarni boshqarish.",
      actions: `<button class="button danger" id="admin-logout-users">${icons.logout}<span>Chiqish</span></button>`,
      wide: true,
      content: `
        ${adminPageNav("admin-users")}
        <section class="split-layout">
          <section class="panel panel-pad stack">
            <h2 class="section-title">Yangi foydalanuvchi</h2>
            <form id="admin-users-create" class="stack">
              <div class="grid-2">
                <div class="field"><label>To'liq ism</label><input class="input" id="au-name" required></div>
                <div class="field"><label>Username</label><input class="input" id="au-username" required></div>
              </div>
              <div class="grid-2">
                <div class="field"><label>Telefon</label><input class="input" id="au-phone"></div>
                <div class="field"><label>Parol</label><input class="input" id="au-password" type="password" required></div>
              </div>
              <div class="field">
                <label>Role</label>
                <select class="input" id="au-role">
                  <option value="abituriyent">abituriyent</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div class="field">
                <label>Ustoz (abituriyent uchun)</label>
                <select class="input" id="au-teacher"><option value="">Tanlanmagan</option>${teachers.map((t) => `<option value="${t.id}">${escapeHtml(t.fullName)}</option>`).join("")}</select>
              </div>
              <div class="field">
                <label>Guruh (abituriyent uchun)</label>
                <select class="input" id="au-group"><option value="">Tanlanmagan</option>${groups.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("")}</select>
              </div>
              <button class="button primary" type="submit">${icons.plus}<span>Qo'shish</span></button>
            </form>
          </section>
          <section class="panel panel-pad stack">
            <h2 class="section-title">Foydalanuvchilar</h2>
            <div class="field"><input class="input" id="au-search" placeholder="Qidirish..."></div>
            <div class="result-list" id="au-list"></div>
          </section>
        </section>
      `,
    });

    document.getElementById("admin-logout-users").onclick = () => {
      clearAdminToken();
      window.location.reload();
    };

    function userRow(user) {
      return `
        <article class="result-item">
          <div class="result-main">
            ${avatar(user.fullName, user.avatar, "avatar")}
            <div class="result-copy">
              <p class="result-name">${escapeHtml(user.fullName)}</p>
              <p class="result-preview">@${escapeHtml(user.username)} • ${escapeHtml(user.role || "-")}</p>
            </div>
          </div>
          <div class="page-actions">
            <button class="button secondary icon-only" data-au-edit="${user.id}" data-name="${escapeHtml(user.fullName)}" data-username="${escapeHtml(user.username)}" data-phone="${escapeHtml(user.phone || "")}" data-bio="${escapeHtml(user.bio || "")}" title="Tahrirlash">${icons.edit}<span>Edit</span></button>
            <button class="button secondary icon-only" data-au-role="${user.id}" title="Role">${icons.admin}<span>Role</span></button>
            <button class="button danger icon-only" data-au-delete="${user.id}" title="Delete">${icons.trash}<span>Delete</span></button>
          </div>
        </article>
      `;
    }

    async function refreshUsers(query = "") {
      const data = await api(`/api/admin/users?q=${encodeURIComponent(query)}`);
      document.getElementById("au-list").innerHTML = (data.users || []).map(userRow).join("") || emptyState("User yo'q", "Natija topilmadi.");
      bindUserActions();
    }

    function bindUserActions() {
      document.querySelectorAll("[data-au-edit]").forEach((button) => {
        button.onclick = async () => {
          const fullName = window.prompt("To'liq ism", button.dataset.name || "");
          if (fullName === null) return;
          const username = window.prompt("Username", button.dataset.username || "");
          if (username === null) return;
          const phone = window.prompt("Telefon", button.dataset.phone || "");
          if (phone === null) return;
          const bio = window.prompt("Bio", button.dataset.bio || "");
          if (bio === null) return;
          await api(`/api/admin/users/${button.dataset.auEdit}`, { method: "PATCH", body: { fullName, username, phone, bio } });
          toast("Yangilandi", "success");
          await refreshUsers(document.getElementById("au-search").value.trim());
        };
      });
      document.querySelectorAll("[data-au-role]").forEach((button) => {
        button.onclick = async () => {
          const role = window.prompt("Role: admin, teacher yoki abituriyent", "abituriyent");
          if (!role) return;
          await api(`/api/admin/users/${button.dataset.auRole}`, { method: "PATCH", body: { role } });
          toast("Role yangilandi", "success");
          await refreshUsers(document.getElementById("au-search").value.trim());
        };
      });
      document.querySelectorAll("[data-au-delete]").forEach((button) => {
        button.onclick = async () => {
          if (!window.confirm("User o'chirilsinmi?")) return;
          await api(`/api/admin/users/${button.dataset.auDelete}`, { method: "DELETE" });
          toast("User o'chirildi", "success");
          await refreshUsers(document.getElementById("au-search").value.trim());
        };
      });
    }

    document.getElementById("admin-users-create").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button");
      button.disabled = true;
      try {
        await api("/api/admin/users", {
          method: "POST",
          body: {
            fullName: document.getElementById("au-name").value,
            username: document.getElementById("au-username").value,
            phone: document.getElementById("au-phone").value,
            password: document.getElementById("au-password").value,
            role: document.getElementById("au-role").value,
            teacherId: document.getElementById("au-teacher").value,
            groupId: document.getElementById("au-group").value,
          },
        });
        toast("Foydalanuvchi qo'shildi", "success");
        await renderAdminUsersPage();
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };

    let timer = 0;
    document.getElementById("au-search").oninput = (event) => {
      clearTimeout(timer);
      timer = setTimeout(() => refreshUsers(event.target.value.trim()), 220);
    };
    await refreshUsers();
  }

  async function renderAdminGroupsPage() {
    clearPolling();
    if (!(await ensureAdminAccess(routes.adminGroups))) return;
    const [userData, chatData] = await Promise.all([api("/api/admin/users"), api("/api/admin/chats?type=group")]);
    const teachers = (userData.users || []).filter((user) => user.role === "teacher");
    const students = (userData.users || []).filter((user) => user.role === "abituriyent");
    const groups = (chatData.chats || []).filter((chat) => chat.type === "group");

    renderPage({
      title: "Admin Groups",
      subtitle: "Kurs guruhlarini yaratish va nazorat qilish.",
      actions: `<button class="button danger" id="admin-logout-groups">${icons.logout}<span>Chiqish</span></button>`,
      wide: true,
      content: `
        ${adminPageNav("admin-groups")}
        <section class="split-layout">
          <section class="panel panel-pad stack">
            <h2 class="section-title">Yangi guruh</h2>
            <form id="ag-create" class="stack">
              <div class="field"><label>Guruh nomi</label><input class="input" id="ag-name" required></div>
              <div class="field"><label>Fan</label><input class="input" id="ag-subject" required></div>
              <div class="field"><label>Tavsif</label><input class="input" id="ag-description"></div>
              <div class="field"><label>Avatar URL</label><input class="input" id="ag-avatar"></div>
              <div class="field"><label>Ustoz</label><select class="input" id="ag-teacher">${teachers.map((t) => `<option value="${t.id}">${escapeHtml(t.fullName)}</option>`).join("")}</select></div>
              <div class="field">
                <label>Abituriyentlar</label>
                <div class="member-list">${students
                  .map(
                    (student) => `
                      <label class="member-option">
                        <input type="checkbox" name="ag-student" value="${student.id}">
                        ${avatar(student.fullName, student.avatar, "avatar small")}
                        <span>${escapeHtml(student.fullName)}</span>
                      </label>
                    `
                  )
                  .join("")}</div>
              </div>
              <button class="button primary" type="submit">${icons.groups}<span>Guruh yaratish</span></button>
            </form>
          </section>
          <section class="panel panel-pad stack">
            <h2 class="section-title">Mavjud guruhlar</h2>
            <div class="field"><input class="input" id="ag-search" placeholder="Guruh qidirish..."></div>
            <div class="result-list" id="ag-list">${groups
              .map(
                (group) => `
                  <article class="result-item">
                    <div class="result-main">
                      ${avatar(group.name, group.avatar, "avatar")}
                      <div class="result-copy">
                        <p class="result-name">${escapeHtml(group.name)}</p>
                        <p class="result-preview">${escapeHtml(group.subject || "Fan")} • ${escapeHtml(String(group.memberCount || 0))} a'zo</p>
                      </div>
                    </div>
                    <div class="page-actions">
                      <a class="button secondary icon-only" href="${routes.adminAttendance}?group=${encodeURIComponent(group.id)}" title="Davomat">${icons.attendance}<span>Attendance</span></a>
                      <button class="button secondary icon-only" data-ag-edit="${group.id}" data-name="${escapeHtml(group.name)}" data-description="${escapeHtml(group.description || "")}" title="Edit">${icons.edit}<span>Edit</span></button>
                      <button class="button danger icon-only" data-ag-delete="${group.id}" title="Delete">${icons.trash}<span>Delete</span></button>
                    </div>
                  </article>
                `
              )
              .join("")}</div>
          </section>
        </section>
      `,
    });

    document.getElementById("admin-logout-groups").onclick = () => {
      clearAdminToken();
      window.location.reload();
    };

    function bindGroupActions() {
      document.querySelectorAll("[data-ag-edit]").forEach((button) => {
        button.onclick = async () => {
          const name = window.prompt("Guruh nomi", button.dataset.name || "");
          if (name === null) return;
          const description = window.prompt("Tavsif", button.dataset.description || "");
          if (description === null) return;
          await api(`/api/admin/chats/${button.dataset.agEdit}`, { method: "PATCH", body: { name, description } });
          toast("Yangilandi", "success");
          await renderAdminGroupsPage();
        };
      });
      document.querySelectorAll("[data-ag-delete]").forEach((button) => {
        button.onclick = async () => {
          if (!window.confirm("Guruh o'chirilsinmi?")) return;
          await api(`/api/admin/chats/${button.dataset.agDelete}`, { method: "DELETE" });
          toast("Guruh o'chirildi", "success");
          await renderAdminGroupsPage();
        };
      });
    }

    document.getElementById("ag-create").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button");
      button.disabled = true;
      try {
        const studentIds = Array.from(document.querySelectorAll("input[name='ag-student']:checked")).map((input) => input.value);
        await api("/api/admin/groups", {
          method: "POST",
          body: {
            name: document.getElementById("ag-name").value,
            subject: document.getElementById("ag-subject").value,
            description: document.getElementById("ag-description").value,
            avatar: document.getElementById("ag-avatar").value,
            teacherId: document.getElementById("ag-teacher").value,
            studentIds,
          },
        });
        toast("Guruh qo'shildi", "success");
        await renderAdminGroupsPage();
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };

    document.getElementById("ag-search").oninput = (event) => {
      const q = event.target.value.trim().toLowerCase();
      document.querySelectorAll("#ag-list .result-item").forEach((node) => {
        node.style.display = node.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    };
    bindGroupActions();
  }

  async function renderAdminContentPage() {
    clearPolling();
    if (!(await ensureAdminAccess(routes.adminContent))) return;
    const [chatData, announcementData, scheduleData, materialData, siteData] = await Promise.all([
      api("/api/admin/chats?type=group"),
      api("/api/admin/announcements"),
      api("/api/admin/schedules"),
      api("/api/admin/materials"),
      api("/api/admin/site-content"),
    ]);
    const groups = (chatData.chats || []).filter((chat) => chat.type === "group");
    const site = siteData.site || {};
    renderPage({
      title: "Admin Content",
      subtitle: "Landing, e'lon, jadval va materiallarni alohida boshqarish.",
      actions: `<button class="button danger" id="admin-logout-content">${icons.logout}<span>Chiqish</span></button>`,
      wide: true,
      content: `
        ${adminPageNav("admin-content")}
        <section class="panel panel-pad">
          <div class="section-head">
            <div>
              <h2 class="section-title">Landing tahriri</h2>
              <p class="section-subtitle">Asosiy sayt dizayni va kontentini alohida Landing bo'limidan boshqaring.</p>
            </div>
            <a class="button secondary" href="${routes.adminLanding}">Landingga o'tish</a>
          </div>
        </section>
        <section class="split-layout">
          <section class="panel panel-pad stack">
            <h2 class="section-title">E'lon qo'shish</h2>
            <form id="ac-announcement" class="stack">
              <div class="field"><label>Guruh</label><select class="input" id="ac-ann-group"><option value="">Barcha guruhlar</option>${groups.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("")}</select></div>
              <div class="field"><label>Sarlavha</label><input class="input" id="ac-ann-title" required></div>
              <div class="field"><label>Matn</label><textarea class="textarea" id="ac-ann-body"></textarea></div>
              <label class="member-option"><input type="checkbox" id="ac-ann-pinned"><span>Muhim qilish</span></label>
              <button class="button primary" type="submit">${icons.bell}<span>Joylash</span></button>
            </form>
            <div class="mini-card-list">${(announcementData.announcements || [])
              .slice(0, 20)
              .map(
                (item) => `
                  <article class="mini-card">
                    <p class="mini-card-title">${escapeHtml(item.title)}</p>
                    <p class="mini-card-copy">${escapeHtml(item.body)}</p>
                    <div class="page-actions"><button class="button danger icon-only" data-ac-del-ann="${item.id}" title="Delete">${icons.trash}<span>Delete</span></button></div>
                  </article>
                `
              )
              .join("")}</div>
          </section>
          <section class="panel panel-pad stack">
            <h2 class="section-title">Jadval qo'shish</h2>
            <form id="ac-schedule" class="stack">
              <div class="field"><label>Guruh</label><select class="input" id="ac-sch-group">${groups.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("")}</select></div>
              <div class="grid-2">
                <div class="field"><label>Kun</label><select class="input" id="ac-sch-day"><option value="1">Dushanba</option><option value="2">Seshanba</option><option value="3">Chorshanba</option><option value="4">Payshanba</option><option value="5">Juma</option><option value="6">Shanba</option><option value="0">Yakshanba</option></select></div>
                <div class="field"><label>Xona</label><input class="input" id="ac-sch-room"></div>
              </div>
              <div class="grid-2">
                <div class="field"><label>Boshlanish</label><input class="input" id="ac-sch-start" type="time" value="09:00"></div>
                <div class="field"><label>Tugash</label><input class="input" id="ac-sch-end" type="time" value="10:30"></div>
              </div>
              <div class="field"><label>Izoh</label><input class="input" id="ac-sch-note"></div>
              <button class="button primary" type="submit">${icons.calendar}<span>Saqlash</span></button>
            </form>
            <div class="mini-card-list">${(scheduleData.schedules || [])
              .slice(0, 20)
              .map(
                (item) => `
                  <article class="mini-card">
                    <p class="mini-card-title">${escapeHtml(item.group?.name || "Guruh")} • ${escapeHtml(weekdayLabel(item.dayOfWeek))}</p>
                    <p class="mini-card-copy">${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)} ${item.room ? `• ${escapeHtml(item.room)}` : ""}</p>
                    <div class="page-actions"><button class="button danger icon-only" data-ac-del-sch="${item.id}" title="Delete">${icons.trash}<span>Delete</span></button></div>
                  </article>
                `
              )
              .join("")}</div>
          </section>
        </section>
        <section class="panel panel-pad stack">
          <h2 class="section-title">Material qo'shish</h2>
          <form id="ac-material" class="stack">
            <div class="grid-2">
              <div class="field"><label>Guruh</label><select class="input" id="ac-mat-group">${groups.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("")}</select></div>
              <div class="field"><label>Turi</label><select class="input" id="ac-mat-type"><option value="material">Material</option><option value="homework">Vazifa</option><option value="lesson">Dars qaydi</option></select></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Nomi</label><input class="input" id="ac-mat-title" required></div>
              <div class="field"><label>Deadline</label><input class="input" id="ac-mat-date" type="date"></div>
            </div>
            <div class="field"><label>Havola</label><input class="input" id="ac-mat-link"></div>
            <div class="field"><label>Izoh</label><textarea class="textarea" id="ac-mat-description"></textarea></div>
            <button class="button primary" type="submit">${icons.book}<span>Saqlash</span></button>
          </form>
          <div class="mini-card-list">${(materialData.materials || [])
            .slice(0, 30)
            .map(
              (item) => `
                <article class="mini-card">
                  <p class="mini-card-title">${escapeHtml(item.title)} • ${escapeHtml(materialTypeLabel(item.type))}</p>
                  <p class="mini-card-copy">${escapeHtml(item.description)}</p>
                  <div class="page-actions"><button class="button danger icon-only" data-ac-del-mat="${item.id}" title="Delete">${icons.trash}<span>Delete</span></button></div>
                </article>
              `
            )
            .join("")}</div>
        </section>
        <section class="panel panel-pad stack">
          <h2 class="section-title">Landing page sozlamalari</h2>
          <p class="section-subtitle">Logo, favicon, kurslar va galereyani shu yerda tahrirlang.</p>
          <form id="ac-site-form" class="stack">
            <div class="grid-2">
              <div class="field"><label>Brend nomi</label><input class="input" id="ac-site-brand" value="${escapeHtml(site.brandName || "Cliffs")}"></div>
              <div class="field"><label>Tagline</label><input class="input" id="ac-site-tagline" value="${escapeHtml(site.brandTagline || "")}"></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Logo URL</label><input class="input" id="ac-site-logo" value="${escapeHtml(site.logoUrl || "")}" placeholder="https://..."></div>
              <div class="field"><label>Favicon URL</label><input class="input" id="ac-site-favicon" value="${escapeHtml(site.faviconUrl || "")}" placeholder="https://..."></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Logo fayli</label><input class="input" id="ac-site-logo-file" type="file" accept="image/*"></div>
              <div class="field"><label>Favicon fayli</label><input class="input" id="ac-site-favicon-file" type="file" accept="image/*"></div>
            </div>
            <div class="field"><label>Hero sarlavha</label><input class="input" id="ac-site-hero-title" value="${escapeHtml(site.heroTitle || "")}"></div>
            <div class="field"><label>Hero matni</label><textarea class="textarea" id="ac-site-hero-subtitle">${escapeHtml(site.heroSubtitle || "")}</textarea></div>
            <div class="field"><label>Hero rasm URL</label><input class="input" id="ac-site-hero-image" value="${escapeHtml(site.heroImage || "")}" placeholder="https://..."></div>
            <div class="field"><label>Hero rasm fayli</label><input class="input" id="ac-site-hero-file" type="file" accept="image/*"></div>
            <div class="grid-2">
              <div class="field"><label>Telefon</label><input class="input" id="ac-site-phone" value="${escapeHtml(site.phone || "")}"></div>
              <div class="field"><label>Telegram link</label><input class="input" id="ac-site-telegram" value="${escapeHtml(site.telegram || "")}" placeholder="https://t.me/..."></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Manzil</label><input class="input" id="ac-site-address" value="${escapeHtml(site.address || "")}"></div>
              <div class="field"><label>Ish vaqti</label><input class="input" id="ac-site-hours" value="${escapeHtml(site.workingHours || "")}"></div>
            </div>
            <div class="field"><label>Kurslar (har qatorga bittadan)</label><textarea class="textarea" id="ac-site-courses">${escapeHtml((site.courses || []).join("\n"))}</textarea></div>
            <div class="field"><label>Galereya rasmlari URL (har qatorga bittadan)</label><textarea class="textarea" id="ac-site-gallery">${escapeHtml((site.gallery || []).join("\n"))}</textarea></div>
            <div class="field"><label>Galereya fayllari</label><input class="input" id="ac-site-gallery-files" type="file" accept="image/*" multiple></div>
            <button class="button primary" type="submit">${icons.edit}<span>Landingni saqlash</span></button>
          </form>
        </section>
      `,
    });

    document.getElementById("admin-logout-content").onclick = () => {
      clearAdminToken();
      window.location.reload();
    };

    document.getElementById("ac-announcement").onsubmit = async (event) => {
      event.preventDefault();
      try {
        await api("/api/admin/announcements", {
          method: "POST",
          body: {
            groupId: document.getElementById("ac-ann-group").value,
            title: document.getElementById("ac-ann-title").value,
            body: document.getElementById("ac-ann-body").value,
            pinned: document.getElementById("ac-ann-pinned").checked,
          },
        });
        toast("E'lon qo'shildi", "success");
        await renderAdminContentPage();
      } catch (error) {
        toast(error.message, "error");
      }
    };
    document.getElementById("ac-schedule").onsubmit = async (event) => {
      event.preventDefault();
      try {
        await api("/api/admin/schedules", {
          method: "POST",
          body: {
            groupId: document.getElementById("ac-sch-group").value,
            dayOfWeek: document.getElementById("ac-sch-day").value,
            room: document.getElementById("ac-sch-room").value,
            startTime: document.getElementById("ac-sch-start").value,
            endTime: document.getElementById("ac-sch-end").value,
            note: document.getElementById("ac-sch-note").value,
          },
        });
        toast("Jadval qo'shildi", "success");
        await renderAdminContentPage();
      } catch (error) {
        toast(error.message, "error");
      }
    };
    document.getElementById("ac-material").onsubmit = async (event) => {
      event.preventDefault();
      try {
        await api("/api/admin/materials", {
          method: "POST",
          body: {
            groupId: document.getElementById("ac-mat-group").value,
            type: document.getElementById("ac-mat-type").value,
            title: document.getElementById("ac-mat-title").value,
            dueDate: document.getElementById("ac-mat-date").value,
            link: document.getElementById("ac-mat-link").value,
            description: document.getElementById("ac-mat-description").value,
          },
        });
        toast("Material qo'shildi", "success");
        await renderAdminContentPage();
      } catch (error) {
        toast(error.message, "error");
      }
    };
    document.getElementById("ac-site-form").onsubmit = async (event) => {
      event.preventDefault();
      const submitButton = event.currentTarget.querySelector("button[type='submit']");
      submitButton.disabled = true;
      const payload = {
        brandName: document.getElementById("ac-site-brand").value,
        brandTagline: document.getElementById("ac-site-tagline").value,
        logoUrl: document.getElementById("ac-site-logo").value,
        faviconUrl: document.getElementById("ac-site-favicon").value,
        heroTitle: document.getElementById("ac-site-hero-title").value,
        heroSubtitle: document.getElementById("ac-site-hero-subtitle").value,
        heroImage: document.getElementById("ac-site-hero-image").value,
        phone: document.getElementById("ac-site-phone").value,
        telegram: document.getElementById("ac-site-telegram").value,
        address: document.getElementById("ac-site-address").value,
        workingHours: document.getElementById("ac-site-hours").value,
        courses: document
          .getElementById("ac-site-courses")
          .value.split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
        gallery: document
          .getElementById("ac-site-gallery")
          .value.split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
      };
      try {
        const logoFile = document.getElementById("ac-site-logo-file").files?.[0] || null;
        const faviconFile = document.getElementById("ac-site-favicon-file").files?.[0] || null;
        const heroFile = document.getElementById("ac-site-hero-file").files?.[0] || null;
        const galleryFiles = Array.from(document.getElementById("ac-site-gallery-files").files || []);

        if (logoFile) {
          const uploaded = await uploadFile(logoFile, "landing", true);
          payload.logoUrl = uploaded?.url || payload.logoUrl;
        }
        if (faviconFile) {
          const uploaded = await uploadFile(faviconFile, "landing", true);
          payload.faviconUrl = uploaded?.url || payload.faviconUrl;
        }
        if (heroFile) {
          const uploaded = await uploadFile(heroFile, "landing", true);
          payload.heroImage = uploaded?.url || payload.heroImage;
        }
        if (galleryFiles.length) {
          for (const file of galleryFiles) {
            const uploaded = await uploadFile(file, "landing", true);
            if (uploaded?.url) payload.gallery.push(uploaded.url);
          }
        }

        await api("/api/admin/site-content", {
          method: "PUT",
          body: payload,
        });
        state.site = null;
        await loadSiteContent();
        toast("Landing sozlamalari saqlandi", "success");
        await renderAdminContentPage();
      } catch (error) {
        toast(error.message, "error");
      } finally {
        submitButton.disabled = false;
      }
    };

    document.querySelectorAll("[data-ac-del-ann]").forEach((button) => {
      button.onclick = async () => {
        if (!window.confirm("E'lon o'chirilsinmi?")) return;
        await api(`/api/admin/announcements/${button.dataset.acDelAnn}`, { method: "DELETE" });
        toast("E'lon o'chirildi", "success");
        await renderAdminContentPage();
      };
    });
    document.querySelectorAll("[data-ac-del-sch]").forEach((button) => {
      button.onclick = async () => {
        if (!window.confirm("Jadval o'chirilsinmi?")) return;
        await api(`/api/admin/schedules/${button.dataset.acDelSch}`, { method: "DELETE" });
        toast("Jadval o'chirildi", "success");
        await renderAdminContentPage();
      };
    });
    document.querySelectorAll("[data-ac-del-mat]").forEach((button) => {
      button.onclick = async () => {
        if (!window.confirm("Material o'chirilsinmi?")) return;
        await api(`/api/admin/materials/${button.dataset.acDelMat}`, { method: "DELETE" });
        toast("Material o'chirildi", "success");
        await renderAdminContentPage();
      };
    });
  }

  async function renderAdminAttendancePage() {
    clearPolling();
    if (!(await ensureAdminAccess(routes.adminAttendance))) return;
    const chatData = await api("/api/admin/chats?type=group");
    const groups = (chatData.chats || []).filter((chat) => chat.type === "group");
    const preset = queryParam("group");
    renderPage({
      title: "Admin Attendance",
      subtitle: "Barcha oldingi davomat tarixini tekshirish.",
      actions: `<button class="button danger" id="admin-logout-attendance">${icons.logout}<span>Chiqish</span></button>`,
      wide: true,
      content: `
        ${adminPageNav("admin-attendance")}
        <section class="panel panel-pad stack">
          <div class="grid-2">
            <div class="field">
              <label for="ad-group">Guruh</label>
              <select class="input" id="ad-group">
                ${groups.map((group) => `<option value="${group.id}" ${preset === group.id ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="ad-month">Oy</label>
              <input class="input" id="ad-month" type="month" value="${new Date().toISOString().slice(0, 7)}">
            </div>
          </div>
          <div class="page-actions">
            <button class="button secondary" id="ad-load">${icons.search}<span>Ko'rsatish</span></button>
          </div>
          <div id="ad-list">${emptyState("Tanlang", "Guruh va oy bo'yicha yuklang.")}</div>
        </section>
      `,
    });

    document.getElementById("admin-logout-attendance").onclick = () => {
      clearAdminToken();
      window.location.reload();
    };

    async function loadAttendance() {
      const groupId = document.getElementById("ad-group").value;
      if (!groupId) return;
      const month = document.getElementById("ad-month").value;
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      params.set("limit", "360");
      const data = await api(`/api/admin/groups/${groupId}/attendance?${params.toString()}`);
      const rows = data.attendance || [];
      document.getElementById("ad-list").innerHTML = rows.length
        ? `<div class="mini-card-list">${rows
            .map(
              (item) => `
                <article class="mini-card">
                  <div class="mini-card-top">
                    <p class="mini-card-title">${escapeHtml(item.date)}</p>
                    <span class="mini-badge">${escapeHtml(String(item.presentCount || 0))} / ${escapeHtml(String(item.absentCount || 0))}</span>
                  </div>
                  <p class="mini-card-copy">${escapeHtml(item.lessonTopic || item.lessonNote || "Mavzu ko'rsatilmagan")}</p>
                  <div class="member-list">
                    ${(item.records || [])
                      .map(
                        (row) => `
                          <div class="member-option">
                            ${avatar(row.student?.fullName || "Talaba", row.student?.avatar, "avatar small")}
                            <span>${escapeHtml(row.student?.fullName || "Talaba")} - ${row.present ? "Bor" : "Yo'q"}</span>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                </article>
              `
            )
            .join("")}</div>`
        : emptyState("Davomat topilmadi", "Tanlangan oy uchun yozuv yo'q.");
    }

    document.getElementById("ad-load").onclick = async () => {
      try {
        await loadAttendance();
      } catch (error) {
        toast(error.message, "error");
      }
    };
    await loadAttendance().catch(() => {});
  }

  async function renderAdminFinancePage(selectedMonth = queryParam("month") || new Date().toISOString().slice(0, 7)) {
    clearPolling();
    if (!(await ensureAdminAccess(routes.adminFinance))) return;
    const month = /^\d{4}-\d{2}$/.test(selectedMonth) ? selectedMonth : new Date().toISOString().slice(0, 7);
    const [overviewData, userData, chatData] = await Promise.all([
      api(`/api/admin/finance/overview?month=${encodeURIComponent(month)}`),
      api("/api/admin/users"),
      api("/api/admin/chats?type=group"),
    ]);
    const overview = overviewData || {};
    const summary = overview.summary || {};
    const counts = overview.counts || {};
    const plans = overview.studentPlans || [];
    const paymentEntries = overview.paymentEntries || [];
    const salaryEntries = overview.salaryEntries || [];
    const expenseEntries = overview.expenseEntries || [];
    const students = (userData.users || []).filter((item) => item.role === "abituriyent");
    const teachers = (userData.users || []).filter((item) => item.role === "teacher");
    const groups = (chatData.chats || []).filter((item) => item.type === "group");

    renderPage({
      title: "Admin Finance CRM",
      subtitle: "Talaba to'lovi, o'qituvchi maoshi, xarajatlar va markaz foydasini boshqarish.",
      actions: `<button class="button danger" id="admin-logout-finance">${icons.logout}<span>Chiqish</span></button>`,
      wide: true,
      content: `
        ${adminPageNav("admin-finance")}
        <section class="stats-grid">
          <article class="stat-card"><strong>${escapeHtml(formatMoney(summary.expectedIncome || 0))}</strong><span>Kutilgan tushum</span></article>
          <article class="stat-card"><strong>${escapeHtml(formatMoney(summary.collectedIncome || 0))}</strong><span>Yig'ilgan tushum</span></article>
          <article class="stat-card"><strong>${escapeHtml(formatMoney(summary.receivable || 0))}</strong><span>Qolgan qarzdorlik</span></article>
          <article class="stat-card"><strong>${escapeHtml(formatMoney(summary.salaryTotal || 0))}</strong><span>Maoshlar</span></article>
          <article class="stat-card"><strong>${escapeHtml(formatMoney(summary.expenseTotal || 0))}</strong><span>Xarajatlar</span></article>
          <article class="stat-card"><strong>${escapeHtml(formatMoney(summary.ownerNet || 0))}</strong><span>Egasiga qolgan</span></article>
        </section>
        <section class="quick-strip">
          ${quickChip(counts.activePlans || 0, "Faol oylik rejalar")}
          ${quickChip(counts.paid || 0, "To'liq to'lagan")}
          ${quickChip(counts.partial || 0, "Qisman to'lagan")}
          ${quickChip(counts.unpaid || 0, "To'lamagan")}
          ${quickChip(counts.dueSoon || 0, "7 kun ichida")}
          ${quickChip(counts.overdue || 0, "Muddati o'tgan")}
        </section>
        <section class="panel panel-pad stack">
          <div class="grid-2">
            <div class="field">
              <label for="af-month">Hisobot oyi</label>
              <input class="input" id="af-month" type="month" value="${escapeHtml(month)}">
            </div>
            <div class="page-actions" style="align-self:end;">
              <button class="button secondary" id="af-refresh">${icons.search}<span>Yangilash</span></button>
            </div>
          </div>
        </section>
        <section class="split-layout">
          <section class="panel panel-pad stack">
            <h2 class="section-title">Talaba oylik rejasini belgilash</h2>
            <form id="af-plan-form" class="stack">
              <div class="grid-2">
                <div class="field">
                  <label>Talaba</label>
                  <select class="input" id="af-plan-student">${students.map((student) => `<option value="${student.id}">${escapeHtml(student.fullName)}</option>`).join("")}</select>
                </div>
                <div class="field">
                  <label>Guruh (ixtiyoriy)</label>
                  <select class="input" id="af-plan-group"><option value="">Tanlanmagan</option>${groups.map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join("")}</select>
                </div>
              </div>
              <div class="grid-2">
                <div class="field"><label>Oylik summa</label><input class="input" id="af-plan-fee" type="number" min="0" step="1000" value="500000" required></div>
                <div class="field"><label>To'lov kuni (1-28)</label><input class="input" id="af-plan-due" type="number" min="1" max="28" value="5" required></div>
              </div>
              <div class="field"><label>Izoh</label><input class="input" id="af-plan-note" placeholder="Masalan: chegirma bor"></div>
              <label class="member-option"><input type="checkbox" id="af-plan-active" checked><span>Faol reja</span></label>
              <button class="button primary" type="submit">${icons.edit}<span>Rejani saqlash</span></button>
            </form>

            <h2 class="section-title" style="margin-top:10px;">Talaba to'lovini kiritish</h2>
            <form id="af-payment-form" class="stack">
              <div class="grid-2">
                <div class="field">
                  <label>Talaba</label>
                  <select class="input" id="af-pay-student">${students.map((student) => `<option value="${student.id}">${escapeHtml(student.fullName)}</option>`).join("")}</select>
                </div>
                <div class="field">
                  <label>Hisob oy</label>
                  <input class="input" id="af-pay-month" type="month" value="${escapeHtml(month)}">
                </div>
              </div>
              <div class="grid-2">
                <div class="field"><label>To'langan summa</label><input class="input" id="af-pay-amount" type="number" min="1" step="1000" required></div>
                <div class="field">
                  <label>To'lov usuli</label>
                  <select class="input" id="af-pay-method">
                    <option value="cash">Naqd</option>
                    <option value="card">Karta</option>
                    <option value="transfer">O'tkazma</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>
              </div>
              <div class="field"><label>Izoh</label><input class="input" id="af-pay-note" placeholder="Qisman / to'liq"></div>
              <button class="button primary" type="submit">${icons.money}<span>To'lovni saqlash</span></button>
            </form>

            <h2 class="section-title" style="margin-top:10px;">O'qituvchiga maosh ajratish</h2>
            <form id="af-salary-form" class="stack">
              <div class="grid-2">
                <div class="field"><label>O'qituvchi</label><select class="input" id="af-salary-teacher">${teachers.map((teacher) => `<option value="${teacher.id}">${escapeHtml(teacher.fullName)}</option>`).join("")}</select></div>
                <div class="field"><label>Oy</label><input class="input" id="af-salary-month" type="month" value="${escapeHtml(month)}"></div>
              </div>
              <div class="grid-2">
                <div class="field"><label>Maosh summa</label><input class="input" id="af-salary-amount" type="number" min="1" step="1000" required></div>
                <div class="field"><label>Izoh</label><input class="input" id="af-salary-note" placeholder="Masalan: aprel oyligi"></div>
              </div>
              <button class="button primary" type="submit">${icons.money}<span>Maoshni saqlash</span></button>
            </form>

            <h2 class="section-title" style="margin-top:10px;">Xarajat qo'shish</h2>
            <form id="af-expense-form" class="stack">
              <div class="grid-2">
                <div class="field"><label>Nomi</label><input class="input" id="af-expense-title" placeholder="Ijara / internet / reklama" required></div>
                <div class="field"><label>Kategoriya</label><input class="input" id="af-expense-category" value="operatsion"></div>
              </div>
              <div class="grid-2">
                <div class="field"><label>Oy</label><input class="input" id="af-expense-month" type="month" value="${escapeHtml(month)}"></div>
                <div class="field"><label>Summa</label><input class="input" id="af-expense-amount" type="number" min="1" step="1000" required></div>
              </div>
              <div class="field"><label>Izoh</label><input class="input" id="af-expense-note" placeholder="Ixtiyoriy izoh"></div>
              <button class="button primary" type="submit">${icons.money}<span>Xarajatni saqlash</span></button>
            </form>
          </section>

          <section class="panel panel-pad stack">
            <h2 class="section-title">Talabalar bo'yicha to'lov holati</h2>
            ${
              plans.length
                ? `<div class="result-list">
                  ${plans
                    .map(
                      (item) => `
                        <article class="result-item">
                          <div class="result-main">
                            ${avatar(item.student?.fullName || "Talaba", item.student?.avatar, "avatar")}
                            <div class="result-copy">
                              <p class="result-name">${escapeHtml(item.student?.fullName || "Talaba")} • ${escapeHtml(paymentStatusLabel(item.status))}</p>
                              <p class="result-preview">Oylik: ${escapeHtml(formatMoney(item.monthlyFee || 0))} • To'langan: ${escapeHtml(formatMoney(item.paid || 0))} • Qolgan: ${escapeHtml(formatMoney(item.remaining || 0))}</p>
                              <p class="result-preview">To'lov muddati: ${escapeHtml(item.dueDate || "-")} (${escapeHtml(String(item.dueDay || "-"))}-kun) ${item.group?.name ? `• ${escapeHtml(item.group.name)}` : ""}</p>
                              ${
                                (item.notices || []).length
                                  ? `<div class="notice-list">${(item.notices || []).map((notice) => `<p class="notice-item">${escapeHtml(notice)}</p>`).join("")}</div>`
                                  : ""
                              }
                            </div>
                          </div>
                          <div class="page-actions">
                            <button class="button secondary icon-only" data-af-quick-pay="${item.studentId}" data-af-quick-amount="${item.remaining || 0}" title="Qolgan summani to'lov formasiga yuklash">${icons.plus}<span>Pay</span></button>
                          </div>
                        </article>
                      `
                    )
                    .join("")}
                </div>`
                : emptyState("Talaba rejalari yo'q", "Avval oylik rejasini yarating.")
            }

            <h2 class="section-title" style="margin-top:8px;">To'lov tranzaksiyalari (${paymentEntries.length})</h2>
            ${
              paymentEntries.length
                ? `<div class="mini-card-list">
                  ${paymentEntries
                    .slice(0, 60)
                    .map(
                      (item) => `
                        <article class="mini-card">
                          <div class="mini-card-top">
                            <p class="mini-card-title">${escapeHtml(item.student?.fullName || "Talaba")} • ${escapeHtml(formatMoney(item.amount || 0))}</p>
                            <span class="mini-badge">${escapeHtml(item.method || "cash")}</span>
                          </div>
                          <p class="mini-card-copy">${escapeHtml(item.month || "")} • ${escapeHtml(item.group?.name || "Guruh belgilanmagan")} ${item.note ? `• ${escapeHtml(item.note)}` : ""}</p>
                          <div class="page-actions">
                            <span class="subtle-tag">${escapeHtml(formatDate(item.paidAt))}</span>
                            <button class="button danger icon-only" data-af-del-payment="${item.id}" title="O'chirish">${icons.trash}<span>Delete</span></button>
                          </div>
                        </article>
                      `
                    )
                    .join("")}
                </div>`
                : `<p class="muted-copy">Bu oy hali to'lov kiritilmagan.</p>`
            }

            <h2 class="section-title" style="margin-top:8px;">Maosh yozuvlari (${salaryEntries.length})</h2>
            ${
              salaryEntries.length
                ? `<div class="mini-card-list">
                  ${salaryEntries
                    .slice(0, 40)
                    .map(
                      (item) => `
                        <article class="mini-card">
                          <div class="mini-card-top">
                            <p class="mini-card-title">${escapeHtml(item.teacher?.fullName || "O'qituvchi")} • ${escapeHtml(formatMoney(item.amount || 0))}</p>
                            <span class="mini-badge">${escapeHtml(item.month || "")}</span>
                          </div>
                          <p class="mini-card-copy">${escapeHtml(item.note || "Izoh yo'q")}</p>
                          <div class="page-actions">
                            <span class="subtle-tag">${escapeHtml(formatDate(item.paidAt))}</span>
                            <button class="button danger icon-only" data-af-del-salary="${item.id}" title="O'chirish">${icons.trash}<span>Delete</span></button>
                          </div>
                        </article>
                      `
                    )
                    .join("")}
                </div>`
                : `<p class="muted-copy">Bu oy maosh yozuvi yo'q.</p>`
            }

            <h2 class="section-title" style="margin-top:8px;">Xarajat yozuvlari (${expenseEntries.length})</h2>
            ${
              expenseEntries.length
                ? `<div class="mini-card-list">
                  ${expenseEntries
                    .slice(0, 60)
                    .map(
                      (item) => `
                        <article class="mini-card">
                          <div class="mini-card-top">
                            <p class="mini-card-title">${escapeHtml(item.title || "Xarajat")} • ${escapeHtml(formatMoney(item.amount || 0))}</p>
                            <span class="mini-badge">${escapeHtml(item.category || "boshqa")}</span>
                          </div>
                          <p class="mini-card-copy">${escapeHtml(item.month || "")} ${item.note ? `• ${escapeHtml(item.note)}` : ""}</p>
                          <div class="page-actions">
                            <span class="subtle-tag">${escapeHtml(formatDate(item.spentAt))}</span>
                            <button class="button danger icon-only" data-af-del-expense="${item.id}" title="O'chirish">${icons.trash}<span>Delete</span></button>
                          </div>
                        </article>
                      `
                    )
                    .join("")}
                </div>`
                : `<p class="muted-copy">Bu oy xarajat yozuvi yo'q.</p>`
            }
          </section>
        </section>
      `,
    });

    document.getElementById("admin-logout-finance").onclick = () => {
      clearAdminToken();
      window.location.reload();
    };

    const monthInput = document.getElementById("af-month");
    document.getElementById("af-refresh").onclick = async () => {
      await renderAdminFinancePage(monthInput.value || month);
    };

    document.querySelectorAll("[data-af-quick-pay]").forEach((button) => {
      button.onclick = () => {
        const targetStudent = button.dataset.afQuickPay;
        const amount = Number(button.dataset.afQuickAmount || 0);
        const studentSelect = document.getElementById("af-pay-student");
        const amountInput = document.getElementById("af-pay-amount");
        const payMonth = document.getElementById("af-pay-month");
        if (studentSelect) studentSelect.value = targetStudent;
        if (amountInput) amountInput.value = amount > 0 ? String(Math.round(amount)) : "";
        if (payMonth) payMonth.value = monthInput.value || month;
        amountInput?.focus();
      };
    });

    document.getElementById("af-plan-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        const studentId = document.getElementById("af-plan-student").value;
        await api(`/api/admin/finance/tuition/${encodeURIComponent(studentId)}`, {
          method: "PATCH",
          body: {
            monthlyFee: document.getElementById("af-plan-fee").value,
            dueDay: document.getElementById("af-plan-due").value,
            groupId: document.getElementById("af-plan-group").value,
            note: document.getElementById("af-plan-note").value,
            active: document.getElementById("af-plan-active").checked,
            month: monthInput.value || month,
          },
        });
        toast("Oylik reja saqlandi", "success");
        await renderAdminFinancePage(monthInput.value || month);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };

    document.getElementById("af-payment-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        await api("/api/admin/finance/payments", {
          method: "POST",
          body: {
            studentId: document.getElementById("af-pay-student").value,
            month: document.getElementById("af-pay-month").value || monthInput.value || month,
            amount: document.getElementById("af-pay-amount").value,
            method: document.getElementById("af-pay-method").value,
            note: document.getElementById("af-pay-note").value,
          },
        });
        toast("To'lov saqlandi", "success");
        await renderAdminFinancePage(monthInput.value || month);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };

    document.getElementById("af-salary-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        await api("/api/admin/finance/salaries", {
          method: "POST",
          body: {
            teacherId: document.getElementById("af-salary-teacher").value,
            month: document.getElementById("af-salary-month").value || monthInput.value || month,
            amount: document.getElementById("af-salary-amount").value,
            note: document.getElementById("af-salary-note").value,
          },
        });
        toast("Maosh yozuvi saqlandi", "success");
        await renderAdminFinancePage(monthInput.value || month);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };

    document.getElementById("af-expense-form").onsubmit = async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        await api("/api/admin/finance/expenses", {
          method: "POST",
          body: {
            title: document.getElementById("af-expense-title").value,
            category: document.getElementById("af-expense-category").value,
            month: document.getElementById("af-expense-month").value || monthInput.value || month,
            amount: document.getElementById("af-expense-amount").value,
            note: document.getElementById("af-expense-note").value,
          },
        });
        toast("Xarajat saqlandi", "success");
        await renderAdminFinancePage(monthInput.value || month);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };

    document.querySelectorAll("[data-af-del-payment]").forEach((button) => {
      button.onclick = async () => {
        if (!window.confirm("To'lov yozuvi o'chirilsinmi?")) return;
        await api(`/api/admin/finance/payments/${button.dataset.afDelPayment}`, { method: "DELETE" });
        toast("To'lov yozuvi o'chirildi", "success");
        await renderAdminFinancePage(monthInput.value || month);
      };
    });
    document.querySelectorAll("[data-af-del-salary]").forEach((button) => {
      button.onclick = async () => {
        if (!window.confirm("Maosh yozuvi o'chirilsinmi?")) return;
        await api(`/api/admin/finance/salaries/${button.dataset.afDelSalary}`, { method: "DELETE" });
        toast("Maosh yozuvi o'chirildi", "success");
        await renderAdminFinancePage(monthInput.value || month);
      };
    });
    document.querySelectorAll("[data-af-del-expense]").forEach((button) => {
      button.onclick = async () => {
        if (!window.confirm("Xarajat yozuvi o'chirilsinmi?")) return;
        await api(`/api/admin/finance/expenses/${button.dataset.afDelExpense}`, { method: "DELETE" });
        toast("Xarajat yozuvi o'chirildi", "success");
        await renderAdminFinancePage(monthInput.value || month);
      };
    });
  }

  async function renderConversationPage() {
    const chatId = queryParam("id");
    if (!chatId) {
      window.location.replace(page === "group" ? routes.groups : routes.chats);
      return;
    }

    clearPolling();
    await loadMe();

    const [chatData, messagesData, callData] = await Promise.all([
      api(`/api/chats/${chatId}`),
      api(`/api/chats/${chatId}/messages`),
      api(`/api/chats/${chatId}/call`),
    ]);

    const chat = chatData.chat;
    let messages = messagesData.messages || [];
    let groupHub = chat.type === "group" ? await api(`/api/groups/${chatId}/hub`).catch(() => ({ announcements: [], schedule: [], materials: [], canManage: false })) : null;
    let attendanceRows = chat.type === "group" ? (await api(`/api/groups/${chatId}/attendance`).catch(() => ({ attendance: [] }))).attendance || [] : [];
    let selectedFile = null;
    let currentCall = callData.call || null;
    let callConfig = null;
    let localStream = null;
    let audioEnabled = true;
    let videoEnabled = true;
    let callBusy = false;
    let callPollingBusy = false;
    let callOpen = false;
    const peerMap = new Map();
    const remoteStreams = new Map();
    const queuedCandidates = new Map();

    renderPage({
      title: chat.name,
      subtitle: chat.type === "group" ? chat.description || "Guruh suhbati" : chat.subtitle || "Shaxsiy chat",
      actions: `
        ${actionButton("back", chat.type === "group" ? routes.groups : routes.chats, "Orqaga")}
        ${chat.type === "group" ? `<button class="icon-button" id="open-group-menu" aria-label="Guruh menyusi" title="Guruh menyusi">${icons.menu}</button>` : ""}
        <button class="icon-button ${currentCall ? "live" : ""}" id="open-call-button" aria-label="Videochat" title="Videochat">${icons.video}</button>
        ${profileButton()}
      `,
      wide: true,
      chatMode: true,
      content: `
        <div class="chat-layout">
          <section class="panel chat-room">
            <div class="chat-thread" id="chat-thread"></div>
            <section class="composer-wrap">
              <div class="composer-panel">
                <div id="file-preview"></div>
                <form id="composer-form" class="composer-form">
                  <label class="upload-button" aria-label="Rasm tanlash">
                    ${icons.image}
                    <input id="composer-file" type="file" accept="image/*">
                  </label>
                  <div class="composer-grow">
                    <textarea class="textarea" id="composer-text" placeholder="Xabar yozing"></textarea>
                  </div>
                  <button class="button primary icon-only" type="submit" aria-label="Yuborish" title="Yuborish">${icons.send}<span>Yuborish</span></button>
                </form>
              </div>
            </section>
          </section>
        </div>
        ${
          chat.type === "group"
            ? `
              <section class="group-menu-layer hide" id="group-menu-layer">
                <button class="group-menu-backdrop" id="group-menu-backdrop" type="button" aria-label="Yopish"></button>
                <aside class="group-menu-sheet">
                  <div class="group-menu-head">
                    <div>
                      <p class="kicker">Guruh menyusi</p>
                      <h2 class="section-title">${escapeHtml(chat.name)}</h2>
                      <p class="group-menu-meta">${escapeHtml(chat.subject || "Fan belgilanmagan")}${chat.description ? ` • ${escapeHtml(chat.description)}` : ""}</p>
                    </div>
                    <button class="icon-button" id="close-group-menu" aria-label="Yopish" title="Yopish">${icons.close}</button>
                  </div>
                  <div class="group-menu-scroll">
                    <details class="toggle-panel" open>
                      <summary>Ishtirokchilar <span class="toggle-count">${escapeHtml(String((chat.members || []).length))} ta</span></summary>
                      <div class="toggle-body">
                        <div class="members-row members-drawer-row">
                          ${(chat.members || [])
                            .map(
                              (member) => `
                                <a class="member-chip" href="${profileHref(member.id)}">
                                  ${avatar(member.fullName, member.avatar, "avatar small")}
                                  <span>${escapeHtml(member.fullName)}</span>
                                </a>
                              `
                            )
                            .join("")}
                        </div>
                      </div>
                    </details>
                    <div id="group-hub-root"></div>
                    <div id="attendance-root"></div>
                  </div>
                </aside>
              </section>
            `
            : ""
        }
        <section class="call-layer hide" id="call-layer">
          <div class="call-shell">
            <div class="call-head">
              <div>
                <p class="kicker">Videochat</p>
                <h2 class="section-title">${escapeHtml(chat.name)}</h2>
                <p class="section-subtitle" id="call-status">${escapeHtml(chat.type === "group" ? "Guruhli videochat" : "1v1 videochat")}</p>
              </div>
              <button class="icon-button" id="leave-call-top" aria-label="Chiqish" title="Chiqish">${icons.close}</button>
            </div>
            <div class="call-grid" id="call-grid"></div>
            <div class="call-empty hide" id="call-empty">Boshqa ishtirokchilar qo'shilishini kuting.</div>
            <div class="call-footer">
              <button class="button secondary icon-only" id="toggle-audio" aria-label="Mikrofon" title="Mikrofon">${icons.mic}<span>Mic</span></button>
              <button class="button secondary icon-only" id="toggle-video" aria-label="Kamera" title="Kamera">${icons.video}<span>Video</span></button>
              <button class="button danger icon-only" id="leave-call-button" aria-label="Videochatni yopish" title="Videochatni yopish">${icons.close}<span>Leave</span></button>
            </div>
          </div>
        </section>
      `,
    });

    const thread = document.getElementById("chat-thread");
    const filePreview = document.getElementById("file-preview");
    const fileInput = document.getElementById("composer-file");
    const textInput = document.getElementById("composer-text");
    const form = document.getElementById("composer-form");
    const callLayer = document.getElementById("call-layer");
    const callGrid = document.getElementById("call-grid");
    const callEmpty = document.getElementById("call-empty");
    const callStatus = document.getElementById("call-status");
    const callButton = document.getElementById("open-call-button");
    const audioButton = document.getElementById("toggle-audio");
    const videoButton = document.getElementById("toggle-video");
    const leaveButtons = [document.getElementById("leave-call-button"), document.getElementById("leave-call-top")];
    const groupMenuLayer = document.getElementById("group-menu-layer");
    const groupMenuButton = document.getElementById("open-group-menu");
    const groupMenuBackdrop = document.getElementById("group-menu-backdrop");
    const closeGroupMenuButton = document.getElementById("close-group-menu");
    const groupHubRoot = document.getElementById("group-hub-root");
    const attendanceRoot = document.getElementById("attendance-root");
    const canMarkAttendance = chat.type === "group" && chat.teacherId === state.me.id;
    const canManageGroupHub = chat.type === "group" && !!groupHub?.canManage;

    function openGroupMenu() {
      if (!groupMenuLayer) return;
      groupMenuLayer.classList.remove("hide");
      document.body.classList.add("group-menu-open");
    }

    function closeGroupMenu() {
      if (!groupMenuLayer) return;
      groupMenuLayer.classList.add("hide");
      document.body.classList.remove("group-menu-open");
    }

    function renderGroupHub() {
      if (chat.type !== "group" || !groupHubRoot) return;
      const announcements = (groupHub?.announcements || []).slice(0, 4);
      const schedule = (groupHub?.schedule || []).slice(0, 6);
      const materials = (groupHub?.materials || []).slice(0, 5);

      groupHubRoot.innerHTML = `
        <section class="group-hub">
          <details class="toggle-panel" ${announcements.length ? "open" : ""}>
            <summary>E'lonlar <span class="toggle-count">${announcements.length} ta</span></summary>
            <div class="toggle-body">
              ${announcements.length ? `<div class="mini-card-list">${announcements.map((item) => announcementCard(item)).join("")}</div>` : `<p class="muted-copy">Hali e'lon yo'q.</p>`}
            </div>
          </details>
          <details class="toggle-panel">
            <summary>Jadval <span class="toggle-count">${schedule.length} ta</span></summary>
            <div class="toggle-body">
              ${schedule.length ? `<div class="mini-card-list">${schedule.map((item) => scheduleCard(item)).join("")}</div>` : `<p class="muted-copy">Jadval hali kiritilmagan.</p>`}
            </div>
          </details>
          <details class="toggle-panel">
            <summary>Materiallar <span class="toggle-count">${materials.length} ta</span></summary>
            <div class="toggle-body">
              ${materials.length ? `<div class="mini-card-list">${materials.map((item) => materialCard(item)).join("")}</div>` : `<p class="muted-copy">Material yoki vazifa hali yo'q.</p>`}
            </div>
          </details>
          ${
            canManageGroupHub
              ? `
                <div class="group-hub-tools">
                  <details class="toggle-panel">
                    <summary>Guruh e'loni yozish</summary>
                    <div class="toggle-body">
                      <form id="group-announcement-form" class="stack">
                        <div class="field"><label>Sarlavha</label><input class="input" id="group-announcement-title" required></div>
                        <div class="field"><label>Matn</label><textarea class="textarea" id="group-announcement-body" placeholder="Muhim xabar..."></textarea></div>
                        <label class="member-option">
                          <input type="checkbox" id="group-announcement-pinned">
                          <span>Muhim qilib belgilash</span>
                        </label>
                        <button class="button secondary" type="submit">${icons.bell}<span>E'lon yuborish</span></button>
                      </form>
                    </div>
                  </details>
                  <details class="toggle-panel">
                    <summary>Material yoki vazifa qo'shish</summary>
                    <div class="toggle-body">
                      <form id="group-material-form" class="stack">
                        <div class="grid-2">
                          <div class="field">
                            <label>Turi</label>
                            <select class="input" id="group-material-type">
                              <option value="material">Material</option>
                              <option value="homework">Vazifa</option>
                              <option value="lesson">Dars qaydi</option>
                            </select>
                          </div>
                          <div class="field">
                            <label>Deadline</label>
                            <input class="input" id="group-material-date" type="date">
                          </div>
                        </div>
                        <div class="field"><label>Nomi</label><input class="input" id="group-material-title" required></div>
                        <div class="field"><label>Havola</label><input class="input" id="group-material-link" placeholder="https://..."></div>
                        <div class="field"><label>Izoh</label><textarea class="textarea" id="group-material-description" placeholder="Mavzu yoki topshiriq tafsilotlari"></textarea></div>
                        <button class="button secondary" type="submit">${icons.book}<span>Saqlash</span></button>
                      </form>
                    </div>
                  </details>
                </div>
              `
              : ""
          }
        </section>
      `;

      document.getElementById("group-announcement-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          await api(`/api/groups/${chat.id}/announcements`, {
            method: "POST",
            body: {
              title: document.getElementById("group-announcement-title").value,
              body: document.getElementById("group-announcement-body").value,
              pinned: document.getElementById("group-announcement-pinned").checked,
            },
          });
          groupHub = await api(`/api/groups/${chat.id}/hub`);
          renderGroupHub();
          toast("E'lon qo'shildi", "success");
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById("group-material-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        try {
          await api(`/api/groups/${chat.id}/materials`, {
            method: "POST",
            body: {
              type: document.getElementById("group-material-type").value,
              dueDate: document.getElementById("group-material-date").value,
              title: document.getElementById("group-material-title").value,
              link: document.getElementById("group-material-link").value,
              description: document.getElementById("group-material-description").value,
            },
          });
          groupHub = await api(`/api/groups/${chat.id}/hub`);
          renderGroupHub();
          toast("Material qo'shildi", "success");
        } catch (error) {
          toast(error.message, "error");
        } finally {
          button.disabled = false;
        }
      });
    }

    function renderAttendance() {
      if (chat.type !== "group" || !attendanceRoot) return;
      const latest = attendanceRows[0];
      const groupStudents = (chat.members || []).filter((member) => member.id !== chat.teacherId);
      const latestMarkup = latest
        ? (latest.records || [])
            .map(
              (row) => `
              <div class="member-option">
                ${avatar(row.student?.fullName || "Talaba", row.student?.avatar, "avatar small")}
                <span>${escapeHtml(row.student?.fullName || "Talaba")} - ${row.present ? "Bor" : "Yo'q"}</span>
              </div>
            `
            )
            .join("")
        : `<p class="muted-copy">Hali davomat kiritilmagan</p>`;
      const historyMarkup = attendanceRows.length
        ? `<div class="mini-card-list">${attendanceRows
            .map(
              (item) => `
                <article class="mini-card">
                  <div class="mini-card-top">
                    <p class="mini-card-title">${escapeHtml(item.date || "-")}</p>
                    <span class="mini-badge">${escapeHtml(String(item.presentCount || 0))} / ${escapeHtml(String(item.absentCount || 0))}</span>
                  </div>
                  <p class="mini-card-copy">${escapeHtml(item.lessonTopic || item.lessonNote || "Mavzu ko'rsatilmagan")}</p>
                </article>
              `
            )
            .join("")}</div>`
        : `<p class="muted-copy">Oldingi davomat yozuvlari yo'q.</p>`;
      attendanceRoot.innerHTML = `
        <details class="toggle-panel">
          <summary>Davomat <span class="toggle-count">${escapeHtml(latest?.date || "-")}</span></summary>
          <div class="toggle-body group-section-stack">
            <div class="member-list">${latestMarkup}</div>
            ${
              canMarkAttendance
                ? `
                  <details class="toggle-panel">
                    <summary>Bugungi davomatni belgilash</summary>
                    <div class="toggle-body">
                      <form id="attendance-form" class="stack">
                        <p class="section-subtitle">Belgilanganlar "bor" deb saqlanadi.</p>
                        <div class="grid-2">
                          <div class="field">
                            <label>Dars mavzusi</label>
                            <input class="input" id="attendance-topic" placeholder="Masalan: Present Perfect">
                          </div>
                          <div class="field">
                            <label>Uyga vazifa</label>
                            <input class="input" id="attendance-homework" placeholder="Masalan: Unit 4, ex 3">
                          </div>
                        </div>
                        <div class="field">
                          <label>Qisqa izoh</label>
                          <input class="input" id="attendance-note" placeholder="Bugungi dars bo'yicha izoh">
                        </div>
                        <div class="member-list">
                          ${groupStudents
                            .map(
                              (student) => `
                                <label class="member-option">
                                  <input type="checkbox" name="attendance-student" value="${student.id}" checked>
                                  ${avatar(student.fullName, student.avatar, "avatar small")}
                                  <span>${escapeHtml(student.fullName)}</span>
                                </label>
                              `
                            )
                            .join("")}
                        </div>
                        <button class="button secondary" type="submit">${icons.edit}<span>Davomatni saqlash</span></button>
                      </form>
                    </div>
                  </details>
                `
                : ""
            }
            <details class="toggle-panel">
              <summary>Oldingi davomatlar <span class="toggle-count">${escapeHtml(String(attendanceRows.length))} ta</span></summary>
              <div class="toggle-body">
                ${historyMarkup}
              </div>
            </details>
          </div>
        </details>
      `;
      if (canMarkAttendance) {
        document.getElementById("attendance-form")?.addEventListener("submit", submitAttendanceForm);
      }
    }

    async function submitAttendanceForm(event) {
      event.preventDefault();
      try {
        const groupStudents = (chat.members || []).filter((member) => member.id !== chat.teacherId);
        if (!groupStudents.length) throw new Error("Davomat uchun talaba yo'q");
        const presentIds = new Set(Array.from(document.querySelectorAll("input[name='attendance-student']:checked")).map((input) => input.value));
        const records = groupStudents.map((student) => ({ studentId: student.id, present: presentIds.has(student.id) }));
        if (!records.length) throw new Error("Davomat tanlanmadi");
        const data = await api(`/api/groups/${chat.id}/attendance`, {
          method: "POST",
          body: {
            records,
            lessonTopic: document.getElementById("attendance-topic")?.value || "",
            lessonNote: document.getElementById("attendance-note")?.value || "",
            homework: document.getElementById("attendance-homework")?.value || "",
          },
        });
        attendanceRows = data.attendance || [];
        renderAttendance();
        toast("Davomat saqlandi", "success");
      } catch (error) {
        toast(error.message, "error");
      }
    }

    function nearBottom() {
      return thread.scrollHeight - thread.scrollTop - thread.clientHeight < 88;
    }

    function paintMessages(scrollToBottom = false) {
      thread.innerHTML = messages.length
        ? messages.map((message) => messageItem(message, chat.type)).join("")
        : emptyState("Xabar yo'q", "Pastdagi forma orqali birinchi xabarni yuboring.");
      if (scrollToBottom) {
        window.requestAnimationFrame(() => {
          thread.scrollTop = thread.scrollHeight;
        });
      }
    }

    function paintPreview() {
      if (!selectedFile) {
        filePreview.innerHTML = "";
        return;
      }
      filePreview.innerHTML = `
        <div class="preview-strip">
          <div>
            <strong>${escapeHtml(selectedFile.name)}</strong>
            <div class="section-subtitle">${Math.round(selectedFile.size / 1024)} KB</div>
          </div>
          <button class="button secondary" id="remove-preview" type="button">Olib tashlash</button>
        </div>
      `;
      document.getElementById("remove-preview").addEventListener("click", () => {
        selectedFile = null;
        fileInput.value = "";
        paintPreview();
      });
    }

    async function refreshMessages(forceScroll = false) {
      const shouldStick = forceScroll || nearBottom();
      const fresh = await api(`/api/chats/${chatId}/messages`);
      messages = fresh.messages || [];
      paintMessages(shouldStick);
    }

    function updateCallButton() {
      callButton.classList.toggle("live", !!currentCall);
    }

    function updateCallControls() {
      audioButton.innerHTML = `${audioEnabled ? icons.mic : icons.micOff}<span>Mic</span>`;
      videoButton.innerHTML = `${videoEnabled ? icons.video : icons.videoOff}<span>Video</span>`;
      audioButton.classList.toggle("muted", !audioEnabled);
      videoButton.classList.toggle("muted", !videoEnabled);
    }

    function tileMarkup(user, isLocal = false) {
      return `
        <article class="call-tile ${isLocal ? "local" : ""}" data-user-id="${escapeHtml(user.id)}">
          <video autoplay playsinline ${isLocal ? "muted" : ""}></video>
          <span class="call-tag">${escapeHtml(isLocal ? "Siz" : user.fullName || user.username || "User")}</span>
        </article>
      `;
    }

    function ensureVideoTile(user, isLocal = false) {
      let tile = callGrid.querySelector(`[data-user-id="${CSS.escape(user.id)}"]`);
      if (!tile) {
        callGrid.insertAdjacentHTML("beforeend", tileMarkup(user, isLocal));
        tile = callGrid.querySelector(`[data-user-id="${CSS.escape(user.id)}"]`);
      }
      tile.classList.toggle("local", isLocal);
      tile.querySelector(".call-tag").textContent = isLocal ? "Siz" : user.fullName || user.username || "User";
      return tile.querySelector("video");
    }

    function removeVideoTile(userId) {
      const tile = callGrid.querySelector(`[data-user-id="${CSS.escape(userId)}"]`);
      if (tile) tile.remove();
    }

    function applyStream(videoNode, stream) {
      if (!videoNode || !stream) return;
      if (videoNode.srcObject !== stream) {
        videoNode.srcObject = stream;
      }
      videoNode.play().catch(() => {});
    }

    function syncCallEmptyState() {
      const others = (currentCall?.participants || []).filter((participant) => participant.id !== state.me.id).length;
      callEmpty.classList.toggle("hide", !callOpen || others > 0);
    }

    function renderCallTiles() {
      const allowedIds = new Set();
      if (localStream && state.me) {
        allowedIds.add(state.me.id);
        applyStream(ensureVideoTile(state.me, true), localStream);
      } else if (state.me) {
        removeVideoTile(state.me.id);
      }
      for (const participant of currentCall?.participants || []) {
        if (!participant || participant.id === state.me.id) continue;
        allowedIds.add(participant.id);
        const stream = remoteStreams.get(participant.id);
        const video = ensureVideoTile(participant, false);
        if (stream) applyStream(video, stream);
      }
      callGrid.querySelectorAll("[data-user-id]").forEach((node) => {
        if (!allowedIds.has(node.dataset.userId)) node.remove();
      });
      syncCallEmptyState();
    }

    async function getCallConfig() {
      if (!callConfig) {
        callConfig = await api("/api/video/config");
      }
      return callConfig;
    }

    async function sendSignal(callId, toUserId, type, data) {
      await api(`/api/calls/${callId}/signal`, {
        method: "POST",
        body: { toUserId, type, data },
      });
    }

    function queueCandidate(userId, candidate) {
      const list = queuedCandidates.get(userId) || [];
      list.push(candidate);
      queuedCandidates.set(userId, list);
    }

    async function flushCandidates(userId) {
      const entry = peerMap.get(userId);
      const list = queuedCandidates.get(userId) || [];
      if (!entry || !entry.pc.remoteDescription || !list.length) return;
      while (list.length) {
        const candidate = list.shift();
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {}
      }
      if (!list.length) queuedCandidates.delete(userId);
    }

    async function createPeer(participant, initiate = false) {
      if (peerMap.has(participant.id)) return peerMap.get(participant.id);
      const config = await getCallConfig();
      const pc = new RTCPeerConnection({ iceServers: config.iceServers || [] });
      const remoteStream = new MediaStream();
      remoteStreams.set(participant.id, remoteStream);
      const entry = { pc, participant, initiated: false };
      peerMap.set(participant.id, entry);

      for (const track of localStream?.getTracks() || []) {
        pc.addTrack(track, localStream);
      }

      pc.ontrack = (event) => {
        for (const track of event.streams[0]?.getTracks?.() || []) {
          const exists = remoteStream.getTracks().some((item) => item.id === track.id);
          if (!exists) remoteStream.addTrack(track);
        }
        renderCallTiles();
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && currentCall) {
          sendSignal(currentCall.id, participant.id, "candidate", event.candidate.toJSON ? event.candidate.toJSON() : event.candidate).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (["failed", "closed"].includes(pc.connectionState)) {
          pc.close();
          peerMap.delete(participant.id);
          remoteStreams.delete(participant.id);
          queuedCandidates.delete(participant.id);
          removeVideoTile(participant.id);
        }
      };

      await flushCandidates(participant.id);

      if (initiate && !entry.initiated && currentCall) {
        entry.initiated = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(currentCall.id, participant.id, "offer", pc.localDescription);
      }

      return entry;
    }

    async function handleSignal(signal) {
      if (!currentCall || signal.fromUserId === state.me.id) return;
      const participant = (currentCall.participants || []).find((item) => item.id === signal.fromUserId) || {
        id: signal.fromUserId,
        fullName: "User",
        username: "",
      };
      if (signal.type === "candidate") {
        const entry = peerMap.get(signal.fromUserId);
        if (!entry || !entry.pc.remoteDescription) {
          queueCandidate(signal.fromUserId, signal.data);
          return;
        }
        await entry.pc.addIceCandidate(new RTCIceCandidate(signal.data));
        return;
      }

      const entry = await createPeer(participant, false);
      if (signal.type === "offer") {
        await entry.pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        await flushCandidates(signal.fromUserId);
        const answer = await entry.pc.createAnswer();
        await entry.pc.setLocalDescription(answer);
        await sendSignal(currentCall.id, signal.fromUserId, "answer", entry.pc.localDescription);
      }
      if (signal.type === "answer") {
        await entry.pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        await flushCandidates(signal.fromUserId);
      }
    }

    async function syncPeers() {
      if (!currentCall || !localStream) return;
      const remoteIds = new Set();
      for (const participant of currentCall.participants || []) {
        if (!participant || participant.id === state.me.id) continue;
        remoteIds.add(participant.id);
        const shouldInitiate = state.me.id < participant.id;
        await createPeer(participant, shouldInitiate);
      }
      for (const [userId, entry] of peerMap.entries()) {
        if (!remoteIds.has(userId)) {
          entry.pc.close();
          peerMap.delete(userId);
          remoteStreams.delete(userId);
          queuedCandidates.delete(userId);
          removeVideoTile(userId);
        }
      }
      renderCallTiles();
    }

    async function ensureLocalMedia() {
      if (localStream) return localStream;
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
        throw new Error("Brauzer videochatni qo'llamaydi");
      }
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      audioEnabled = true;
      videoEnabled = true;
      updateCallControls();
      renderCallTiles();
      return localStream;
    }

    function teardownPeers() {
      for (const [userId, entry] of peerMap.entries()) {
        entry.pc.close();
        peerMap.delete(userId);
        remoteStreams.delete(userId);
        queuedCandidates.delete(userId);
        removeVideoTile(userId);
      }
    }

    function stopLocalMedia() {
      for (const track of localStream?.getTracks() || []) {
        track.stop();
      }
      localStream = null;
      if (state.me) removeVideoTile(state.me.id);
    }

    function openCallLayer() {
      closeGroupMenu();
      callOpen = true;
      callLayer.classList.remove("hide");
      document.body.classList.add("call-open");
      syncCallEmptyState();
    }

    function closeCallLayer() {
      callOpen = false;
      callLayer.classList.add("hide");
      document.body.classList.remove("call-open");
      syncCallEmptyState();
    }

    async function pollCall() {
      if (!currentCall || callPollingBusy) return;
      callPollingBusy = true;
      try {
        const data = await api(`/api/calls/${currentCall.id}/poll`);
        currentCall = data.call || null;
        updateCallButton();
        if (!currentCall) {
          callStatus.textContent = "Videochat tugadi";
          await leaveCall(true);
          return;
        }
        callStatus.textContent = `${currentCall.participants.length} kishi videochatda`;
        renderCallTiles();
        for (const signal of data.signals || []) {
          await handleSignal(signal);
        }
        await syncPeers();
      } finally {
        callPollingBusy = false;
      }
    }

    async function startOrJoinCall() {
      if (callBusy) return;
      callBusy = true;
      callButton.disabled = true;
      try {
        await ensureLocalMedia();
        const data = currentCall
          ? await api(`/api/calls/${currentCall.id}/join`, { method: "POST" })
          : await api(`/api/chats/${chatId}/call/start`, { method: "POST" });
        currentCall = data.call || null;
        updateCallButton();
        if (!currentCall) throw new Error("Videochat ishga tushmadi");
        callStatus.textContent = `${currentCall.participants.length} kishi videochatda`;
        openCallLayer();
        renderCallTiles();
        await syncPeers();
        window.clearInterval(state.callTimer);
        state.callTimer = window.setInterval(() => {
          pollCall().catch(() => {});
        }, 1200);
        await pollCall();
      } catch (error) {
        stopLocalMedia();
        closeCallLayer();
        toast(error.message, "error");
      } finally {
        callBusy = false;
        callButton.disabled = false;
      }
    }

    async function leaveCall(silent = false) {
      window.clearInterval(state.callTimer);
      state.callTimer = 0;
      try {
        if (currentCall) {
          await api(`/api/calls/${currentCall.id}/leave`, { method: "POST" });
        }
      } catch (error) {
        if (!silent) toast(error.message, "error");
      } finally {
        currentCall = null;
        teardownPeers();
        stopLocalMedia();
        updateCallButton();
        closeCallLayer();
      }
    }

    function leaveCallKeepAlive() {
      if (!currentCall) return;
      const headers = new Headers({ "Content-Type": "application/json" });
      if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
      fetch(`/api/calls/${currentCall.id}/leave`, {
        method: "POST",
        headers,
        body: "{}",
        keepalive: true,
      }).catch(() => {});
    }

    fileInput.addEventListener("change", (event) => {
      selectedFile = event.target.files[0] || null;
      paintPreview();
    });

    textInput.addEventListener("input", () => {
      syncTextareaHeight(textInput);
    });

    groupMenuButton?.addEventListener("click", () => {
      if (groupMenuLayer?.classList.contains("hide")) openGroupMenu();
      else closeGroupMenu();
    });

    groupMenuBackdrop?.addEventListener("click", closeGroupMenu);
    closeGroupMenuButton?.addEventListener("click", closeGroupMenu);

    callButton.addEventListener("click", async () => {
      await startOrJoinCall();
    });

    audioButton.addEventListener("click", () => {
      audioEnabled = !audioEnabled;
      for (const track of localStream?.getAudioTracks() || []) {
        track.enabled = audioEnabled;
      }
      updateCallControls();
    });

    videoButton.addEventListener("click", () => {
      videoEnabled = !videoEnabled;
      for (const track of localStream?.getVideoTracks() || []) {
        track.enabled = videoEnabled;
      }
      updateCallControls();
    });

    leaveButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        await leaveCall();
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        const uploaded = selectedFile ? await uploadFile(selectedFile, "messages") : null;
        await api(`/api/chats/${chatId}/messages`, {
          method: "POST",
          body: {
            text: textInput.value.trim(),
            mediaUrl: uploaded ? uploaded.url : "",
            mediaType: uploaded ? "image" : "",
          },
        });
        textInput.value = "";
        textInput.style.height = "54px";
        selectedFile = null;
        fileInput.value = "";
        paintPreview();
        await refreshMessages(true);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    });

    window.addEventListener("pagehide", leaveCallKeepAlive, { once: true });
    updateCallButton();
    updateCallControls();
    renderGroupHub();
    renderAttendance();
    paintMessages(true);
    state.pollTimer = window.setInterval(() => {
      refreshMessages().catch(() => {});
    }, 3000);
  }

  async function init() {
    try {
      applyTheme(resolvedTheme());
      await loadSiteContent();

      if (isAdminPage()) {
        clearPolling();
        if (page === "admin") {
          await renderAdminOverviewPage();
          return;
        }
        if (page === "admin-landing") {
          await renderAdminLandingPage();
          return;
        }
        if (page === "admin-users") {
          await renderAdminUsersPage();
          return;
        }
        if (page === "admin-groups") {
          await renderAdminGroupsPage();
          return;
        }
        if (page === "admin-content") {
          await renderAdminContentPage();
          return;
        }
        if (page === "admin-attendance") {
          await renderAdminAttendancePage();
          return;
        }
        if (page === "admin-finance") {
          await renderAdminFinancePage();
          return;
        }
        await renderAdminOverviewPage();
        return;
      }

      if (page === "index") {
        await renderLandingPage();
        return;
      }

      if (!isProtectedPage()) {
        clearPolling();
        if (state.token) {
          try {
            await loadMe();
            window.location.replace(routes.dashboard);
            return;
          } catch (error) {
            clearToken();
          }
        }
        await renderLoginPage();
        return;
      }

      if (!state.token) {
        window.location.replace(routes.login);
        return;
      }

      if (page === "dashboard") {
        await renderDashboardPage();
        return;
      }
      if (page === "chats") {
        await renderChatsPage();
        return;
      }
      if (page === "chat" || page === "group") {
        await renderConversationPage();
        return;
      }
      if (page === "groups") {
        await renderGroupsPage();
        return;
      }
      if (page === "announcements") {
        await renderAnnouncementsPage();
        return;
      }
      if (page === "schedule") {
        await renderSchedulePage();
        return;
      }
      if (page === "materials") {
        await renderMaterialsPage();
        return;
      }
      if (page === "material") {
        await renderMaterialDetailPage();
        return;
      }
      if (page === "attendance") {
        await renderAttendancePage();
        return;
      }
      if (page === "search") {
        await renderSearchPage();
        return;
      }
      if (page === "profile") {
        await renderProfilePage();
        return;
      }
      if (page === "ai") {
        await renderAiPage();
        return;
      }

      window.location.replace(routes.dashboard);
    } catch (error) {
      renderPage({
        title: "Xatolik",
        subtitle: error.message || "Sahifa yuklanmadi",
        content: `<section class="panel panel-pad">${emptyState("Muammo yuz berdi", error.message || "Qayta urinib ko'ring.", `<a class="button primary" href="${routes.dashboard}">Asosiyga qaytish</a>`)}</section>`,
      });
      toast(error.message || "Server xatosi", "error");
    }
  }

  window.addEventListener("beforeunload", clearPolling);
  init();
})();

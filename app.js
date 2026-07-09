/* Health Dashboard — client-side screen navigation (no backend).
   Groups the report's existing sections into 5 tab-screens at runtime, using the
   HTML marker comments as stable boundaries (they survive report regeneration).
   Keeps the PWA offline: pure DOM, no data fetching. */
(function () {
  "use strict";

  var SCREENS = [
    { id: "obzor",    icon: "🏠", label: "Обзор" },
    { id: "pitanie",  icon: "🍽", label: "Питание" },
    { id: "vosst",    icon: "😴", label: "Восст." },
    { id: "analizy",  icon: "🔬", label: "Анализы" },
    { id: "protokol", icon: "💊", label: "Протокол" }
  ];

  // A boundary comment → the screen everything after it belongs to (until the next boundary).
  function screenFor(c) {
    if (c.indexOf("CHARTS_HEALTH:START") >= 0 ||
        c.indexOf("CHARTS_NUTRITION:START") >= 0 ||
        c.indexOf("CHARTS_LABS:START") >= 0) return "obzor";
    if (c.indexOf("КЛЮЧЕВЫЕ НАХОДКИ") >= 0)   return "obzor";
    if (c.indexOf("АНАЛИЗ ПО МЕСЯЦАМ") >= 0)   return "vosst";
    if (c.indexOf("ЕЖЕНЕДЕЛЬНЫЙ") >= 0)        return "vosst";
    if (c.indexOf("2c. ПИТАНИЕ") >= 0)         return "pitanie";
    if (c.indexOf("3. СОН") >= 0)              return "vosst";
    if (c.indexOf("ТРЕНИРОВОЧНЫЙ") >= 0)       return "vosst";
    if (c.indexOf("5. ПИТАНИЕ") >= 0)          return "pitanie";
    if (c.indexOf("ФАРМПРОТОКОЛ") >= 0)        return "protokol";
    if (c.indexOf("НООТРОПЫ") >= 0)            return "protokol";
    if (c.indexOf("LABS:START") >= 0)          return "analizy";   // CHARTS_LABS already handled above
    if (c.indexOf("ДОБАВКИ") >= 0)             return "protokol";
    if (c.indexOf("ПРИОРИТЕТНЫЙ") >= 0)        return "protokol";
    return null;
  }

  // On an overview chart block, tapping its header jumps to the detail tab.
  var JUMP = [
    { match: "Питание сегодня",  to: "pitanie" },
    { match: "Прогресс к цели",  to: "vosst" },
    { match: "ключевые маркеры", to: "analizy" }
  ];

  function build() {
    var container = document.querySelector(".container");
    if (!container || container.dataset.screensReady) return;
    container.dataset.screensReady = "1";

    var screens = {};
    SCREENS.forEach(function (s) {
      var d = document.createElement("div");
      d.className = "screen";
      d.id = "screen-" + s.id;
      screens[s.id] = d;
    });

    var current = "obzor";
    var nodes = Array.prototype.slice.call(container.childNodes);
    nodes.forEach(function (n) {
      if (n.nodeType === 8) {                       // comment → maybe switch screen
        var sc = screenFor(n.nodeValue);
        if (sc) current = sc;
        screens[current].appendChild(n);            // keep markers in the DOM
      } else if (n.nodeType === 1) {                // element → current screen
        screens[current].appendChild(n);
      }
    });
    SCREENS.forEach(function (s) { container.appendChild(screens[s.id]); });

    // progressive disclosure: overview chart headers link to their detail tab
    screens.obzor.querySelectorAll(".sec-header").forEach(function (h) {
      var t = h.textContent;
      JUMP.forEach(function (j) {
        if (t.indexOf(j.match) >= 0) {
          h.style.cursor = "pointer";
          h.insertAdjacentHTML("beforeend",
            '<span style="margin-left:auto;color:var(--accent);font-size:20px;align-self:center">›</span>');
          h.addEventListener("click", function () { show(j.to); });
        }
      });
    });

    // bottom tab bar
    var nav = document.createElement("nav");
    nav.className = "tabbar";
    SCREENS.forEach(function (s) {
      var b = document.createElement("button");
      b.className = "tab";
      b.setAttribute("data-screen", s.id);
      b.innerHTML = '<span class="tab-i">' + s.icon + '</span><span class="tab-l">' + s.label + "</span>";
      b.addEventListener("click", function () { show(s.id); });
      nav.appendChild(b);
    });
    document.body.appendChild(nav);

    function show(id) {
      SCREENS.forEach(function (s) {
        screens[s.id].style.display = s.id === id ? "block" : "none";
        var tab = nav.querySelector('[data-screen="' + s.id + '"]');
        if (tab) tab.classList.toggle("active", s.id === id);
      });
      var hero = document.querySelector(".hero");
      if (hero) hero.style.display = id === "obzor" ? "" : "none";
      window.scrollTo(0, 0);
    }
    window.__showScreen = show;
    show("obzor");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();

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
    if (c.indexOf("CHARTS_HEALTH:START") >= 0)    return "vosst";      // full charts live on detail tabs;
    if (c.indexOf("CHARTS_NUTRITION:START") >= 0)  return "pitanie";   // Overview shows bento tiles built from them
    if (c.indexOf("CHARTS_LABS:START") >= 0)       return "analizy";
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

    // Overview bento: KPI tiles built from the .ovkpi blobs emitted by the chart generators
    var blobs = Array.prototype.slice.call(document.querySelectorAll(".ovkpi"));
    if (blobs.length) {
      var tiles = blobs.map(function (b) { try { return JSON.parse(b.textContent); } catch (e) { return null; } })
                       .filter(Boolean).sort(function (a, b) { return (a.order || 9) - (b.order || 9); });
      var grid = document.createElement("div");
      grid.className = "bento";
      tiles.forEach(function (t) {
        var tile = document.createElement("button");
        tile.className = "tile" + (t.span === 2 ? " wide" : "") + (t.color ? " c-" + t.color : "");
        tile.innerHTML =
          '<div class="eyebrow">' + (t.icon || "") + " " + t.label + "</div>" +
          '<div class="kpi">' + t.value + (t.unit ? '<small>' + t.unit + "</small>" : "") + "</div>" +
          (t.sub ? '<div class="sub">' + t.sub + "</div>" : "") +
          '<span class="chev">›</span>';
        tile.addEventListener("click", function () { show(t.tab); });
        grid.appendChild(tile);
      });
      screens.obzor.insertBefore(grid, screens.obzor.firstChild);
    }

    // progressive disclosure: collapse heavy tables inside detail screens
    ["pitanie", "vosst", "analizy", "protokol"].forEach(function (sid) {
      screens[sid].querySelectorAll(".table-wrap").forEach(function (tw) {
        var rows = tw.querySelectorAll("tr").length;
        if (rows < 5 || tw.closest("details")) return;
        var det = document.createElement("details");
        det.className = "collapse";
        var sum = document.createElement("summary");
        sum.textContent = "📋 Таблица · " + (rows - 1) + " строк";
        tw.parentNode.insertBefore(det, tw);
        det.appendChild(sum);
        det.appendChild(tw);
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

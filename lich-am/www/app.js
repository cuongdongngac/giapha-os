/* Lịch Âm Dòng Họ — dữ liệu chung từ Google Sheet, ghi chú riêng lưu trên máy */
(function () {
  "use strict";
  var A = window.AmLich;
  var CFG = window.LICH_CONFIG || {};
  var TABS = CFG.tabs || { gio: "Ngày giỗ", events: "Sự kiện", contacts: "Danh bạ", settings: "Cài đặt" };
  var LS = { sheet: "lich:sheetUrl", data: "lich:data", notes: "lich:notes", prefs: "lich:prefs" };
  var THU = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  var THANG_AM = ["", "Giêng", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Tám", "Chín", "Mười", "Mười một", "Chạp"];

  // Lễ tết âm lịch cố định
  var LE_AM = [
    { d: 1, m: 1, t: "Tết Nguyên Đán", big: true }, { d: 2, m: 1, t: "Mùng 2 Tết" }, { d: 3, m: 1, t: "Mùng 3 Tết" },
    { d: 15, m: 1, t: "Rằm tháng Giêng (Tết Nguyên Tiêu)", big: true }, { d: 3, m: 3, t: "Tết Hàn thực" },
    { d: 10, m: 3, t: "Giỗ Tổ Hùng Vương", big: true }, { d: 15, m: 4, t: "Lễ Phật đản" },
    { d: 5, m: 5, t: "Tết Đoan Ngọ" }, { d: 15, m: 7, t: "Rằm tháng Bảy – Vu Lan", big: true },
    { d: 15, m: 8, t: "Tết Trung thu", big: true }, { d: 10, m: 10, t: "Tết Hạ nguyên (Tết cơm mới)" },
    { d: 23, m: 12, t: "Ông Công Ông Táo", big: true }
  ];
  var LE_DUONG = [
    { d: 1, m: 1, t: "Tết Dương lịch" }, { d: 30, m: 4, t: "Ngày Giải phóng miền Nam" },
    { d: 1, m: 5, t: "Quốc tế Lao động" }, { d: 2, m: 9, t: "Quốc khánh" }
  ];

  // ---------- tiện ích ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d")
      .toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  function lsGet(k, def) { try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function num(v) { var n = parseInt(String(v || "").trim(), 10); return isNaN(n) ? null : n; }
  function yes(v) { var n = norm(v); return n === "co" || n === "x" || n === "yes" || n === "1" || n === "nhuan" || n === "true"; }
  function phone(v) {
    var d = String(v || "").replace(/[^\d+]/g, "");
    if (/^\d{9}$/.test(d) && d.charAt(0) !== "0") d = "0" + d; // Sheets hay làm mất số 0 đầu
    return d;
  }
  function fmtPhone(p) { return /^0\d{9}$/.test(p) ? p.slice(0, 4) + " " + p.slice(4, 7) + " " + p.slice(7) : p; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function todayJd() { var t = new Date(); return A.jdFromDate(t.getDate(), t.getMonth() + 1, t.getFullYear()); }
  function jdToJs(jd) { var s = A.jdToDate(jd); return new Date(s[2], s[1] - 1, s[0]); }
  function weekday(jd) { return (jd + 1) % 7; } // 0 = Chủ nhật
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2800);
  }

  var lunarCache = {};
  function lunarOf(jd) {
    if (!lunarCache[jd]) { var s = A.jdToDate(jd); lunarCache[jd] = A.solarToLunar(s[0], s[1], s[2]); }
    return lunarCache[jd];
  }
  var leapCache = {};
  function yearHasLeap(y, m) {
    var k = y + "-" + m;
    if (!(k in leapCache)) leapCache[k] = !!A.lunarToSolar(1, m, y, 1);
    return leapCache[k];
  }
  /** Ngày jd có khớp ngày âm d/m không (xử lý tháng nhuận và ngày 30 ở tháng thiếu) */
  function matchLunar(jd, d, m, leap) {
    var L = lunarOf(jd);
    if (L.month !== m) return false;
    if (leap) { if (!L.leap && yearHasLeap(L.year, m)) return false; }
    else if (L.leap) return false;
    if (L.day === d) return true;
    // Giỗ ngày 30 mà tháng đó chỉ có 29 ngày → làm vào ngày 29
    if (d === 30 && L.day === 29 && lunarOf(jd + 1).day === 1) return true;
    return false;
  }

  // ---------- CSV & Google Sheet ----------
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if (q) {
        if (c === '"') { if (text.charAt(i + 1) === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text.charAt(i + 1) === "\n") i++;
        row.push(f); rows.push(row); row = []; f = "";
      } else f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    if (!rows.length) return { headers: [], items: [] };
    var headers = rows[0].map(norm);
    var items = rows.slice(1).filter(function (r) { return r.some(function (x) { return String(x).trim(); }); })
      .map(function (r) { var o = {}; headers.forEach(function (h, j) { o[h] = String(r[j] == null ? "" : r[j]).trim(); }); return o; });
    return { headers: headers, items: items };
  }
  function sheetId(url) {
    var m = String(url || "").match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m) return m[1];
    return /^[a-zA-Z0-9_-]{20,}$/.test(String(url || "").trim()) ? String(url).trim() : null;
  }
  function fetchTab(id, name) {
    var url = "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&headers=1&sheet=" +
      encodeURIComponent(name) + "&t=" + Date.now();
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (t) {
      if (/^\s*</.test(t)) throw new Error("PRIVATE");
      return parseCSV(t);
    });
  }
  function isExample(name) { return /^v[ií] d[uụ]\s*:/i.test(String(name || "").trim()); }

  function buildData(tabs) {
    var data = { gio: [], events: [], contacts: [], settings: {}, updatedAt: Date.now() };
    var g = tabs.gio;
    if (g && g.headers.indexOf("hoten") >= 0 && g.headers.indexOf("ngayam") >= 0) {
      g.items.forEach(function (r) {
        var d = num(r.ngayam), m = num(r.thangam);
        if (!r.hoten || isExample(r.hoten) || !d || !m || d > 30 || m > 12) return;
        data.gio.push({ name: r.hoten, doi: r.doi, chi: r.chinhanh, d: d, m: m, leap: yes(r.thangnhuan),
          year: num(r.nammat), place: r.noicunggio, host: r.nguoilogio, phone: phone(r.dienthoai), note: r.ghichu });
      });
    }
    var e = tabs.events;
    if (e && e.headers.indexOf("tensukien") >= 0) {
      e.items.forEach(function (r) {
        var d = num(r.ngay), m = num(r.thang);
        if (!r.tensukien || isExample(r.tensukien) || !d || !m || d > 31 || m > 12) return;
        data.events.push({ name: r.tensukien, lunar: norm(r.loailich) !== "duong", d: d, m: m, y: num(r.nam),
          time: r.gio, place: r.diadiem, content: r.noidung, host: r.nguoiphutrach, phone: phone(r.dienthoai) });
      });
    }
    var c = tabs.contacts;
    if (c && c.headers.indexOf("hoten") >= 0 && c.headers.indexOf("dienthoai") >= 0) {
      c.items.forEach(function (r) {
        if (!r.hoten || isExample(r.hoten)) return;
        data.contacts.push({ name: r.hoten, doi: r.doi, chi: r.chinhanh, role: r.vaitro, phone: phone(r.dienthoai),
          zalo: phone(r.zalo), addr: r.diachi, note: r.ghichu });
      });
    }
    var s = tabs.settings;
    if (s && s.headers.indexOf("muc") >= 0) {
      s.items.forEach(function (r) { if (r.muc) data.settings[norm(r.muc)] = r.giatri; });
    }
    return data;
  }

  // ---------- trạng thái ----------
  var state = {
    tab: "lich",
    data: lsGet(LS.data, null) || { gio: [], events: [], contacts: [], settings: {} },
    notes: lsGet(LS.notes, []),
    prefs: Object.assign({ remind: false, showTuan: true, remindDays: null }, lsGet(LS.prefs, {})),
    view: null, selected: todayJd(), syncing: false, syncError: null,
    filter: "all", q: "", chi: ""
  };
  (function () { var t = jdToJs(todayJd()); state.view = { y: t.getFullYear(), m: t.getMonth() + 1 }; })();

  function sheetUrl() { return lsGet(LS.sheet, null) || CFG.sheetUrl || ""; }
  function setting(key) { return (state.data.settings || {})[key] || ""; }
  function appName() { return setting("tendongho") ? "Lịch " + setting("tendongho") : (CFG.appName || "Lịch Âm Dòng Họ"); }
  function giaPhaUrl() { var u = setting("linkgiapha") || CFG.giaPhaUrl || ""; return /^https?:\/\/.+\..+/.test(u) ? u : ""; }
  function remindDays() {
    if (state.prefs.remindDays != null) return state.prefs.remindDays;
    var n = num(setting("nhactruocngay")); return n == null ? 3 : n;
  }

  // ---------- sự kiện theo ngày ----------
  function itemsOn(jd) {
    var out = [], s = A.jdToDate(jd), L = lunarOf(jd), d = state.data;
    (d.gio || []).forEach(function (g) {
      if (matchLunar(jd, g.d, g.m, g.leap)) {
        var sub = ["Giỗ ngày " + g.d + "/" + g.m + (g.leap ? " nhuận" : "") + " âm lịch"];
        if (g.year) sub.push("mất năm " + g.year + (L.year - g.year > 0 ? " (" + (L.year - g.year) + " năm)" : ""));
        out.push({ kind: "gio", title: "Giỗ " + g.name, sub: sub.join(" · "), ref: g });
      }
    });
    (d.events || []).forEach(function (e) {
      var hit = e.lunar ? (matchLunar(jd, e.d, e.m, false) && (!e.y || e.y === L.year))
        : (s[0] === e.d && s[1] === e.m && (!e.y || e.y === s[2]));
      if (hit) out.push({ kind: "event", title: e.name, sub: (e.time ? e.time + " · " : "") + (e.place || ""), ref: e });
    });
    if (!L.leap) LE_AM.forEach(function (f) { if (L.day === f.d && L.month === f.m) out.push({ kind: "le", title: f.t, big: f.big }); });
    if (!L.leap && L.month === 12 && lunarOf(jd + 1).day === 1 && lunarOf(jd + 1).month === 1) out.push({ kind: "le", title: "Giao thừa (Tất niên)", big: true });
    LE_DUONG.forEach(function (f) { if (s[0] === f.d && s[1] === f.m) out.push({ kind: "le", title: f.t }); });
    if (A.tietKhiIndex(jd) === 1 && A.tietKhiIndex(jd - 1) === 0) out.push({ kind: "le", title: "Tiết Thanh minh (tảo mộ)", big: true });
    if (state.prefs.showTuan && (L.day === 1 || L.day === 15) && !out.some(function (x) { return x.kind === "le" && /Tết Nguyên|Rằm/.test(x.title); }))
      out.push({ kind: "tuan", title: L.day === 1 ? "Mùng 1 tháng " + THANG_AM[L.month] + (L.leap ? " nhuận" : "") : "Rằm tháng " + THANG_AM[L.month] + (L.leap ? " nhuận" : "") });
    notesOn(jd).forEach(function (n) { out.push({ kind: "note", title: n.text, sub: n.lunar ? "Ghi chú riêng · lặp hằng năm (" + n.lunar.d + "/" + n.lunar.m + " âm)" : "Ghi chú riêng", ref: n }); });
    return out;
  }
  function notesOn(jd) {
    return state.notes.filter(function (n) { return n.lunar ? matchLunar(jd, n.lunar.d, n.lunar.m, false) : n.jd === jd; });
  }

  // ---------- giao diện ----------
  function lunarText(L) {
    return "Ngày " + L.day + " tháng " + THANG_AM[L.month] + (L.leap ? " (nhuận)" : "") + " năm " + A.canChiYear(L.year);
  }
  function dateLabel(jd) {
    var s = A.jdToDate(jd), L = lunarOf(jd), t = todayJd(), diff = jd - t;
    var head = diff === 0 ? "Hôm nay" : diff === 1 ? "Ngày mai" : THU[weekday(jd)];
    return { head: head, solar: pad(s[0]) + "/" + pad(s[1]) + "/" + s[2], lunar: L.day + "/" + L.month + (L.leap ? "N" : "") + " âm", diff: diff };
  }
  function contactBtns(p) {
    if (!p) return "";
    return '<a class="pill call" href="tel:' + esc(p) + '">Gọi ' + esc(fmtPhone(p)) + "</a>";
  }
  function itemHTML(it) {
    var r = it.ref || {}, extra = "";
    if (it.kind === "gio") {
      extra = [r.chi && "Chi: " + esc(r.chi), r.doi && "Đời " + esc(r.doi), r.place && "Nơi cúng: " + esc(r.place),
        r.host && "Người lo: " + esc(r.host), r.note && esc(r.note)].filter(Boolean).join("<br>");
    } else if (it.kind === "event") {
      extra = [r.content && esc(r.content), r.host && "Phụ trách: " + esc(r.host)].filter(Boolean).join("<br>");
    }
    var del = it.kind === "note" ? '<button class="pill ghost" data-del-note="' + esc(r.id) + '">Xóa</button>' : "";
    return '<div class="item k-' + it.kind + (it.big ? " big" : "") + '"><div class="dot"></div><div class="body">' +
      '<div class="title">' + esc(it.title) + "</div>" + (it.sub ? '<div class="sub">' + esc(it.sub) + "</div>" : "") +
      (extra ? '<div class="extra">' + extra + "</div>" : "") +
      ((r.phone || del) ? '<div class="actions">' + contactBtns(r.phone) + del + "</div>" : "") + "</div></div>";
  }

  function renderLich() {
    var v = state.view, first = A.jdFromDate(1, v.m, v.y);
    var daysIn = A.jdFromDate(1, v.m === 12 ? 1 : v.m + 1, v.m === 12 ? v.y + 1 : v.y) - first;
    var lead = (weekday(first) + 6) % 7, t = todayJd();
    var tL = lunarOf(t), tS = A.jdToDate(t);
    var notice = setting("thongbao");
    var h = "";
    if (notice) h += '<div class="notice">' + esc(notice) + "</div>";
    h += '<section class="today-card"><div class="tc-left"><div class="tc-wd">' + THU[weekday(t)] + '</div><div class="tc-solar">' +
      pad(tS[0]) + "/" + pad(tS[1]) + "/" + tS[2] + '</div><div class="tc-cc">Ngày ' + A.canChiDay(t) + " · Tháng " + A.canChiMonth(tL.month, tL.year) +
      '</div></div><div class="tc-right"><div class="tc-lday">' + tL.day + '</div><div class="tc-lmon">tháng ' + THANG_AM[tL.month] +
      (tL.leap ? " nhuận" : "") + "<br>" + A.canChiYear(tL.year) + "</div></div></section>";
    h += nextGioHTML();
    h += '<section class="cal"><div class="cal-head"><button class="icon-btn" data-nav="-1" aria-label="Tháng trước">‹</button>' +
      '<div class="cal-title">Tháng ' + v.m + " / " + v.y + '</div><button class="icon-btn" data-nav="1" aria-label="Tháng sau">›</button>' +
      '<button class="pill ghost" data-nav="0">Hôm nay</button></div><div class="grid">';
    ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach(function (d, i) { h += '<div class="wd' + (i === 6 ? " sun" : "") + '">' + d + "</div>"; });
    for (var i = 0; i < lead; i++) h += '<div class="cell empty"></div>';
    for (var d = 0; d < daysIn; d++) {
      var jd = first + d, L = lunarOf(jd), items = itemsOn(jd), kinds = {};
      items.forEach(function (x) { kinds[x.kind] = 1; });
      var cls = "cell" + (jd === t ? " today" : "") + (jd === state.selected ? " sel" : "") + (weekday(jd) === 0 ? " sun" : "") +
        (L.day === 1 || L.day === 15 ? " tuan" : "") + (kinds.le && items.some(function (x) { return x.big; }) ? " fest" : "");
      var ltxt = L.day === 1 ? L.day + "/" + L.month + (L.leap ? "N" : "") : L.day;
      var dots = ["gio", "event", "note"].filter(function (k) { return kinds[k]; }).map(function (k) { return '<i class="d-' + k + '"></i>'; }).join("");
      h += '<button class="' + cls + '" data-jd="' + jd + '"><span class="s">' + (d + 1) + '</span><span class="l">' + ltxt + '</span><span class="dots">' + dots + "</span></button>";
    }
    h += '</div><div class="legend"><span><i class="d-gio"></i>Ngày giỗ</span><span><i class="d-event"></i>Sự kiện</span><span><i class="d-note"></i>Ghi chú riêng</span></div></section>';
    h += dayDetailHTML(state.selected);
    return h;
  }

  function nextGioHTML() {
    var t = todayJd();
    for (var jd = t; jd < t + 60; jd++) {
      var g = itemsOn(jd).filter(function (x) { return x.kind === "gio" || x.kind === "event"; });
      if (g.length) {
        var lb = dateLabel(jd);
        return '<button class="next-gio" data-goto="' + jd + '"><span class="ng-k">' + (lb.diff === 0 ? "Hôm nay" : "Còn " + lb.diff + " ngày") +
          '</span><span class="ng-t">' + esc(g[0].title) + (g.length > 1 ? " và " + (g.length - 1) + " việc khác" : "") +
          '</span><span class="ng-d">' + lb.solar + " · " + lb.lunar + "</span></button>";
      }
    }
    return "";
  }

  function dayDetailHTML(jd) {
    var s = A.jdToDate(jd), L = lunarOf(jd), items = itemsOn(jd);
    var h = '<section class="detail"><div class="dt-head"><div><div class="dt-solar">' + THU[weekday(jd)] + ", " + pad(s[0]) + "/" + pad(s[1]) + "/" + s[2] +
      '</div><div class="dt-lunar">' + lunarText(L) + '</div></div></div><div class="dt-meta">' +
      "<span>Ngày <b>" + A.canChiDay(jd) + "</b></span><span>Tháng <b>" + A.canChiMonth(L.month, L.year) + "</b></span><span>Tiết <b>" + A.tietKhi(jd) + "</b></span></div>" +
      '<div class="dt-gio">Giờ hoàng đạo: ' + A.gioHoangDao(jd).join(", ") + "</div>";
    h += items.length ? '<div class="list">' + items.map(itemHTML).join("") + "</div>" : '<p class="muted">Không có ngày giỗ hay sự kiện.</p>';
    h += '<form class="note-form" data-jd="' + jd + '"><textarea name="text" rows="2" placeholder="Thêm ghi chú riêng cho ngày này (chỉ lưu trên máy bạn)"></textarea>' +
      '<label class="chk"><input type="checkbox" name="repeat"> Lặp lại hằng năm theo ngày âm (' + L.day + "/" + L.month + ")</label>" +
      '<button class="btn" type="submit">Lưu ghi chú</button></form></section>';
    return h;
  }

  function renderSapToi() {
    var t = todayJd(), groups = [], f = state.filter;
    for (var jd = t; jd <= t + 120; jd++) {
      var it = itemsOn(jd).filter(function (x) {
        if (f === "all") return true;
        if (f === "le") return x.kind === "le" || x.kind === "tuan";
        return x.kind === f;
      });
      if (it.length) groups.push({ jd: jd, items: it });
    }
    var chips = [["all", "Tất cả"], ["gio", "Ngày giỗ"], ["event", "Sự kiện"], ["le", "Lễ tết"], ["note", "Ghi chú"]];
    var h = '<div class="chips">' + chips.map(function (c) { return '<button class="chip' + (f === c[0] ? " on" : "") + '" data-filter="' + c[0] + '">' + c[1] + "</button>"; }).join("") + "</div>";
    if (!groups.length) h += '<p class="muted center">Không có gì trong 4 tháng tới.</p>';
    groups.forEach(function (g) {
      var lb = dateLabel(g.jd);
      h += '<div class="group"><div class="g-head' + (lb.diff <= 7 ? " soon" : "") + '"><span class="g-day">' + lb.head + "</span><span>" + lb.solar + " · " + lb.lunar +
        '</span><span class="g-cnt">' + (lb.diff === 0 ? "" : lb.diff + " ngày nữa") + '</span></div><div class="list">' + g.items.map(itemHTML).join("") + "</div></div>";
    });
    return h;
  }

  function renderDanhBa() {
    var cs = state.data.contacts || [], q = norm(state.q), chis = [];
    cs.forEach(function (c) { if (c.chi && chis.indexOf(c.chi) < 0) chis.push(c.chi); });
    var list = cs.filter(function (c) {
      if (state.chi && c.chi !== state.chi) return false;
      if (!q) return true;
      return norm([c.name, c.role, c.chi, c.addr, c.phone].join(" ")).indexOf(q) >= 0;
    });
    var h = '<div class="search"><input type="search" id="q" placeholder="Tìm tên, vai trò, số điện thoại…" value="' + esc(state.q) + '">' +
      (chis.length ? '<select id="chi"><option value="">Tất cả</option>' + chis.map(function (c) { return "<option" + (c === state.chi ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select>" : "") + "</div>";
    if (!cs.length) return h + '<p class="muted center">Chưa có danh bạ. Thêm vào tab “Danh bạ” trong Google Sheet rồi bấm cập nhật.</p>';
    h += '<p class="muted small">' + list.length + " người</p>";
    list.forEach(function (c) {
      h += '<div class="contact"><div class="avatar">' + esc(c.name.replace(/^(Ông|Bà|Anh|Chị|Cô|Chú|Bác|Cụ)\s+/i, "").split(" ").pop().charAt(0)) + '</div><div class="body"><div class="title">' + esc(c.name) +
        '</div><div class="sub">' + [c.role, c.chi, c.doi && "Đời " + c.doi].filter(Boolean).map(esc).join(" · ") + "</div>" +
        (c.addr ? '<div class="sub">' + esc(c.addr) + "</div>" : "") + (c.note ? '<div class="sub">' + esc(c.note) + "</div>" : "") +
        '<div class="actions">' + contactBtns(c.phone) + (c.zalo ? '<a class="pill zalo" href="https://zalo.me/' + esc(c.zalo) + '">Zalo</a>' : "") + "</div></div></div>";
    });
    return h;
  }

  function renderCaiDat() {
    var d = state.data, upd = d.updatedAt ? new Date(d.updatedAt) : null, native = !!notif();
    var h = '<section class="card"><h3>Nguồn dữ liệu chung</h3><p class="muted small">Link Google Sheet của dòng họ (đã chia sẻ “Bất kỳ ai có đường liên kết đều xem được”).</p>' +
      '<form id="sheetForm"><input id="sheetUrl" type="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="' + esc(sheetUrl()) + '">' +
      '<button class="btn" type="submit">Lưu &amp; cập nhật</button></form>' +
      '<p class="small">' + (upd ? "Cập nhật lúc " + pad(upd.getHours()) + ":" + pad(upd.getMinutes()) + " " + pad(upd.getDate()) + "/" + pad(upd.getMonth() + 1) + "/" + upd.getFullYear() +
        " — " + d.gio.length + " ngày giỗ, " + d.events.length + " sự kiện, " + d.contacts.length + " liên hệ" : "Chưa tải dữ liệu.") + "</p>" +
      (state.syncError ? '<p class="err">' + esc(state.syncError) + "</p>" : "") + "</section>";
    h += '<section class="card"><h3>Nhắc nhở</h3>' +
      (native ? '<label class="chk"><input type="checkbox" id="remind"' + (state.prefs.remind ? " checked" : "") + "> Thông báo trước ngày giỗ, sự kiện và ghi chú riêng</label>"
        : '<p class="muted small">Thông báo chỉ có trên bản cài đặt (APK).</p>') +
      '<label class="row">Nhắc trước <select id="remindDays">' + [0, 1, 2, 3, 5, 7, 10].map(function (n) {
        return "<option value=\"" + n + "\"" + (n === remindDays() ? " selected" : "") + ">" + (n === 0 ? "đúng ngày" : n + " ngày") + "</option>";
      }).join("") + "</select></label>" +
      '<label class="chk"><input type="checkbox" id="showTuan"' + (state.prefs.showTuan ? " checked" : "") + "> Hiện mùng 1 và ngày rằm</label></section>";
    h += '<section class="card"><h3>Ghi chú riêng</h3><p class="muted small">' + state.notes.length + ' ghi chú, chỉ lưu trên máy này. Sao lưu trước khi đổi điện thoại.</p>' +
      '<div class="actions"><button class="pill" id="exportNotes">Sao chép bản sao lưu</button><button class="pill ghost" id="importNotes">Khôi phục</button></div></section>';
    if (giaPhaUrl()) h += '<a class="btn wide" href="' + esc(giaPhaUrl()) + '" target="_blank" rel="noopener">Mở trang Gia phả</a>';
    h += '<p class="muted small center">Âm lịch tính theo giờ Việt Nam (UTC+7). Giỗ ngày 30 vào năm tháng thiếu sẽ hiện ở ngày 29.</p>';
    return h;
  }

  function render() {
    $("#appName").textContent = appName();
    document.title = appName();
    var st = state.syncing ? "Đang cập nhật…" : state.syncError ? "Không cập nhật được — đang dùng dữ liệu đã lưu" :
      state.data.updatedAt ? "Dữ liệu dòng họ đã đồng bộ" : (sheetUrl() ? "Chưa có dữ liệu" : "Chưa kết nối Google Sheet");
    $("#syncStatus").textContent = st;
    var fn = { lich: renderLich, saptoi: renderSapToi, danhba: renderDanhBa, caidat: renderCaiDat }[state.tab];
    $("#view").innerHTML = fn();
    document.querySelectorAll(".tabbar button").forEach(function (b) { b.classList.toggle("active", b.dataset.tab === state.tab); });
  }

  // ---------- đồng bộ ----------
  function sync(silent) {
    var id = sheetId(sheetUrl());
    if (!id) { if (!silent) toast("Chưa có link Google Sheet — vào Cài đặt để nhập"); render(); return Promise.resolve(); }
    state.syncing = true; render();
    var names = ["gio", "events", "contacts", "settings"];
    return Promise.all(names.map(function (k) {
      return fetchTab(id, TABS[k]).catch(function (e) { if (e.message === "PRIVATE") throw e; return null; });
    })).then(function (res) {
      var tabs = {}; names.forEach(function (k, i) { tabs[k] = res[i]; });
      if (!tabs.gio && !tabs.events && !tabs.contacts) throw new Error("NET");
      state.data = buildData(tabs); lsSet(LS.data, state.data);
      state.syncError = null; lunarCacheTrim();
      if (!silent) toast("Đã cập nhật dữ liệu dòng họ");
      scheduleNotifications();
    }).catch(function (e) {
      state.syncError = e.message === "PRIVATE" ? "Google Sheet chưa mở quyền xem: vào Chia sẻ → “Bất kỳ ai có đường liên kết” → Người xem."
        : "Không kết nối được. Kiểm tra mạng hoặc link Google Sheet.";
      if (!silent) toast(state.syncError);
    }).then(function () { state.syncing = false; render(); });
  }
  function lunarCacheTrim() { if (Object.keys(lunarCache).length > 5000) lunarCache = {}; }

  // ---------- thông báo (chỉ trên APK) ----------
  function notif() { var C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.LocalNotifications; }
  function scheduleNotifications() {
    var LN = notif(); if (!LN) return Promise.resolve();
    return LN.getPending().then(function (p) {
      return p.notifications && p.notifications.length ? LN.cancel({ notifications: p.notifications.map(function (n) { return { id: n.id }; }) }) : null;
    }).then(function () {
      if (!state.prefs.remind) return;
      var t = todayJd(), list = [], id = 1, now = Date.now(), before = remindDays();
      for (var jd = t; jd <= t + 60 && list.length < 60; jd++) {
        itemsOn(jd).forEach(function (it) {
          if (it.kind !== "gio" && it.kind !== "event" && it.kind !== "note") return;
          var lb = dateLabel(jd), day = jdToJs(jd);
          var onDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 6, 30);
          if (onDay.getTime() > now) list.push({ id: id++, title: "Hôm nay: " + it.title, body: lb.solar + " (" + lb.lunar + ")" + (it.sub ? " · " + it.sub : ""), schedule: { at: onDay, allowWhileIdle: true } });
          if (before > 0) {
            var pre = new Date(day.getFullYear(), day.getMonth(), day.getDate() - before, 7, 0);
            if (pre.getTime() > now) list.push({ id: id++, title: "Còn " + before + " ngày: " + it.title, body: THU[weekday(jd)] + " " + lb.solar + " (" + lb.lunar + ")", schedule: { at: pre, allowWhileIdle: true } });
          }
        });
      }
      return list.length ? LN.schedule({ notifications: list }) : null;
    }).catch(function () { });
  }
  function enableReminders(on) {
    var LN = notif(); if (!LN) return;
    if (!on) { state.prefs.remind = false; lsSet(LS.prefs, state.prefs); scheduleNotifications(); return; }
    LN.requestPermissions().then(function (r) {
      state.prefs.remind = r.display === "granted"; lsSet(LS.prefs, state.prefs);
      if (!state.prefs.remind) toast("Bạn chưa cho phép thông báo trong cài đặt điện thoại");
      scheduleNotifications(); render();
    });
  }

  // ---------- sự kiện giao diện ----------
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button, a"); if (!b) return;
    if (b.dataset.tab) { state.tab = b.dataset.tab; render(); window.scrollTo(0, 0); return; }
    if (b.dataset.jd) { state.selected = +b.dataset.jd; render(); var d = $(".detail"); if (d) d.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (b.dataset.goto) {
      var jd = +b.dataset.goto, s = A.jdToDate(jd); state.selected = jd; state.view = { y: s[2], m: s[1] }; render();
      var dd = $(".detail"); if (dd) dd.scrollIntoView({ behavior: "smooth" }); return;
    }
    if (b.dataset.nav) {
      var n = +b.dataset.nav, v = state.view;
      if (n === 0) { var t = A.jdToDate(todayJd()); state.view = { y: t[2], m: t[1] }; state.selected = todayJd(); }
      else { var m = v.m + n, y = v.y; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } state.view = { y: y, m: m }; }
      render(); return;
    }
    if (b.dataset.filter) { state.filter = b.dataset.filter; render(); return; }
    if (b.dataset.delNote) {
      state.notes = state.notes.filter(function (x) { return x.id !== b.dataset.delNote; }); lsSet(LS.notes, state.notes);
      scheduleNotifications(); render(); toast("Đã xóa ghi chú"); return;
    }
    if (b.id === "btnRefresh") { sync(false); return; }
    if (b.id === "exportNotes") {
      var txt = JSON.stringify(state.notes);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast("Đã sao chép — dán vào Zalo/ghi chú để cất giữ"); })
        .catch(function () { window.prompt("Sao chép đoạn này để cất giữ:", txt); });
      return;
    }
    if (b.id === "importNotes") {
      var raw = window.prompt("Dán bản sao lưu ghi chú vào đây:");
      if (!raw) return;
      try {
        var arr = JSON.parse(raw); if (!Array.isArray(arr)) throw 0;
        var ids = {}; state.notes.forEach(function (x) { ids[x.id] = 1; });
        arr.forEach(function (x) { if (x && x.id && x.text && !ids[x.id]) state.notes.push(x); });
        lsSet(LS.notes, state.notes); scheduleNotifications(); render(); toast("Đã khôi phục ghi chú");
      } catch (err) { toast("Bản sao lưu không hợp lệ"); }
    }
  });
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.id === "sheetForm") {
      var u = $("#sheetUrl").value.trim();
      if (u && !sheetId(u)) { toast("Link không đúng dạng Google Sheet"); return; }
      lsSet(LS.sheet, u || null); state.data = { gio: [], events: [], contacts: [], settings: {} }; lsSet(LS.data, null);
      sync(false); return;
    }
    if (f.classList.contains("note-form")) {
      var text = f.text.value.trim(); if (!text) return;
      var jd = +f.dataset.jd, L = lunarOf(jd);
      var note = { id: "n" + Date.now().toString(36), text: text, created: Date.now() };
      if (f.repeat.checked) note.lunar = { d: L.day, m: L.month }; else note.jd = jd;
      state.notes.push(note); lsSet(LS.notes, state.notes); scheduleNotifications(); render(); toast("Đã lưu ghi chú");
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "remind") enableReminders(t.checked);
    if (t.id === "remindDays") { state.prefs.remindDays = +t.value; lsSet(LS.prefs, state.prefs); scheduleNotifications(); }
    if (t.id === "showTuan") { state.prefs.showTuan = t.checked; lsSet(LS.prefs, state.prefs); }
    if (t.id === "chi") { state.chi = t.value; render(); }
  });
  document.addEventListener("input", function (e) {
    if (e.target.id === "q") {
      state.q = e.target.value; var pos = e.target.selectionStart; render();
      var q = $("#q"); q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) { }
    }
  });
  // Vuốt trái/phải để đổi tháng
  (function () {
    var x0 = null, y0 = null;
    document.addEventListener("touchstart", function (e) { if (e.target.closest(".grid")) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { var btn = $('[data-nav="' + (dx < 0 ? 1 : -1) + '"]'); if (btn) btn.click(); }
    }, { passive: true });
  })();
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state.data.updatedAt && Date.now() - state.data.updatedAt > 6 * 3600 * 1000) sync(true);
  });

  render();
  sync(true);
  window.__lich = { state: state, itemsOn: itemsOn, buildData: buildData, parseCSV: parseCSV, render: render };
})();

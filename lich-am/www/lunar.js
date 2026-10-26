/*
 * Âm lịch Việt Nam — thuật toán của Hồ Ngọc Đức (https://www.informatik.uni-leipzig.de/~duc/amlich/)
 * Tính theo múi giờ Việt Nam (UTC+7). Lưu ý: lịch Trung Quốc tính theo UTC+8 nên đôi khi
 * lệch một ngày đầu tháng hoặc lệch cả tháng nhuận so với lịch Việt Nam.
 */
(function (global) {
  "use strict";
  var PI = Math.PI;
  var TZ = 7;
  function INT(d) { return Math.floor(d); }

  function jdFromDate(dd, mm, yy) {
    var a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
    var jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
  }

  function jdToDate(jd) {
    var a, b, c;
    if (jd > 2299160) { a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
    else { b = 0; c = jd + 32082; }
    var d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
    return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
  }

  function NewMoon(k) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    var Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    var deltat;
    if (T < -11) deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
    else deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Jd1 + C1 - deltat;
  }

  function SunLongitude(jdn) {
    var T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
    var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    var L = (280.46645 + 36000.76983 * T + 0.0003032 * T2 + DL) * dr;
    return L - PI * 2 * INT(L / (PI * 2));
  }

  function getSunLongitude(dayNumber, tz) { return INT(SunLongitude(dayNumber - 0.5 - tz / 24) / PI * 6); }
  function getNewMoonDay(k, tz) { return INT(NewMoon(k) + 0.5 + tz / 24); }

  function getLunarMonth11(yy, tz) {
    var off = jdFromDate(31, 12, yy) - 2415021;
    var k = INT(off / 29.530588853);
    var nm = getNewMoonDay(k, tz);
    if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
    return nm;
  }

  function getLeapMonthOffset(a11, tz) {
    var k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    var last, i = 1, arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
    return i - 1;
  }

  /** Dương → Âm. Trả về {day, month, year, leap, jd} */
  function solarToLunar(dd, mm, yy) {
    var tz = TZ;
    var dayNumber = jdFromDate(dd, mm, yy);
    var k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    var monthStart = getNewMoonDay(k + 1, tz);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
    var a11 = getLunarMonth11(yy, tz), b11 = a11, lunarYear;
    if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1, tz); }
    else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1, tz); }
    var lunarDay = dayNumber - monthStart + 1;
    var diff = INT((monthStart - a11) / 29);
    var lunarLeap = 0, lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      var leapMonthDiff = getLeapMonthOffset(a11, tz);
      if (diff >= leapMonthDiff) { lunarMonth = diff + 10; if (diff === leapMonthDiff) lunarLeap = 1; }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap === 1, jd: dayNumber };
  }

  /** Âm → Dương. Trả về [dd, mm, yy] hoặc null nếu không có ngày đó (vd tháng nhuận không tồn tại). */
  function lunarToSolar(lunarDay, lunarMonth, lunarYear, lunarLeap) {
    var tz = TZ, a11, b11;
    if (lunarMonth < 11) { a11 = getLunarMonth11(lunarYear - 1, tz); b11 = getLunarMonth11(lunarYear, tz); }
    else { a11 = getLunarMonth11(lunarYear, tz); b11 = getLunarMonth11(lunarYear + 1, tz); }
    var k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    var off = lunarMonth - 11;
    if (off < 0) off += 12;
    if (b11 - a11 > 365) {
      var leapOff = getLeapMonthOffset(a11, tz);
      var leapMonth = leapOff - 2;
      if (leapMonth < 0) leapMonth += 12;
      if (lunarLeap && lunarMonth !== leapMonth) return null;
      else if (lunarLeap || off >= leapOff) off += 1;
    } else if (lunarLeap) return null;
    var monthStart = getNewMoonDay(k + off, tz);
    return jdToDate(monthStart + lunarDay - 1);
  }

  var CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  var CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  var TIETKHI = ["Xuân phân", "Thanh minh", "Cốc vũ", "Lập hạ", "Tiểu mãn", "Mang chủng", "Hạ chí", "Tiểu thử",
    "Đại thử", "Lập thu", "Xử thử", "Bạch lộ", "Thu phân", "Hàn lộ", "Sương giáng", "Lập đông", "Tiểu tuyết",
    "Đại tuyết", "Đông chí", "Tiểu hàn", "Đại hàn", "Lập xuân", "Vũ thủy", "Kinh trập"];
  // Giờ hoàng đạo theo chi của ngày (chuỗi 12 bit, bắt đầu từ giờ Tý)
  var GIO_HD = ["110100101100", "001101001011", "110011010010", "101100110100", "001011001101", "010010110011"];

  function canChiYear(y) { return CAN[(y + 6) % 10] + " " + CHI[(y + 8) % 12]; }
  function canChiMonth(m, y) { return CAN[(y * 12 + m + 3) % 10] + " " + CHI[(m + 1) % 12]; }
  function canChiDay(jd) { return CAN[(jd + 9) % 10] + " " + CHI[(jd + 1) % 12]; }
  /** Chỉ số tiết khí (0..23) tính tại cuối ngày (giờ VN), 0 = Xuân phân. Ngày bắt đầu tiết = ngày chỉ số đổi. */
  function tietKhiIndex(jd) { return INT(SunLongitude(jd + 0.5 - TZ / 24) / PI * 12); }
  function tietKhi(jd) { return TIETKHI[tietKhiIndex(jd)]; }
  function gioHoangDao(jd) {
    var chiDay = (jd + 1) % 12, pattern = GIO_HD[chiDay % 6], out = [];
    for (var i = 0; i < 12; i++) {
      if (pattern.charAt(i) === "1") {
        var h1 = (i * 2 + 23) % 24, h2 = (i * 2 + 1) % 24;
        out.push(CHI[i] + " (" + h1 + "-" + h2 + "h)");
      }
    }
    return out;
  }

  global.AmLich = {
    jdFromDate: jdFromDate, jdToDate: jdToDate, solarToLunar: solarToLunar, lunarToSolar: lunarToSolar,
    canChiYear: canChiYear, canChiMonth: canChiMonth, canChiDay: canChiDay,
    tietKhi: tietKhi, tietKhiIndex: tietKhiIndex, gioHoangDao: gioHoangDao, CAN: CAN, CHI: CHI
  };
})(typeof window !== "undefined" ? window : globalThis);

/* Material analysis calculations. No screen code, so the web page, the tests
   and a later Android/PWA version can all share this file.
   Source of formulas: client's demo Excel, sheet "Material Analysis" (brickwork 100 mm, 1:4). */
(function (root) {
  'use strict';

  var DEFAULTS = {
    areaSqm: 10,      // wall area, sqm
    brickL: 0.23,     // actual brick length, m
    brickW: 0.10,     // actual brick width = wall thickness, m
    brickH: 0.075,    // actual brick height, m
    joint: 0.01,      // mortar joint thickness, m
    ratio: 4,         // mortar 1:ratio (cement : sand)
    dryPct: 33,       // % added for dry volume of mortar
    wastePct: 20,     // % added for filling, cut bricks, wastage
    bagVolume: 0.035  // cum per 50 kg cement bag
  };

  function brickwork(input) {
    var i = Object.assign({}, DEFAULTS, input);
    var errors = [];
    ['areaSqm', 'brickL', 'brickW', 'brickH', 'ratio', 'bagVolume'].forEach(function (k) {
      if (!(typeof i[k] === 'number' && isFinite(i[k]) && i[k] > 0)) { errors.push(k + ' must be a number above 0'); }
    });
    ['joint', 'dryPct', 'wastePct'].forEach(function (k) {
      if (!(typeof i[k] === 'number' && isFinite(i[k]) && i[k] >= 0)) { errors.push(k + ' must be a number, 0 or more'); }
    });
    if (errors.length) { return { ok: false, errors: errors }; }

    var bricksExact = i.areaSqm / ((i.brickL + i.joint) * (i.brickH + i.joint));
    var bricksSay = Math.ceil(Number(bricksExact.toFixed(9)));      // Excel: ROUNDUP(...,0)
    var coveredArea = bricksExact * i.brickL * i.brickH;            // face area taken by bricks
    var mortarArea = i.areaSqm - coveredArea;
    var mortarWet = mortarArea * i.brickW;
    var mortarDry = mortarWet * (1 + i.dryPct / 100);
    var mortarTotal = mortarDry * (1 + i.wastePct / 100);
    var cementCum = mortarTotal / (1 + i.ratio);
    var sandCum = mortarTotal * i.ratio / (1 + i.ratio);
    return {
      ok: true, inputs: i,
      bricksExact: bricksExact, bricksSay: bricksSay, coveredArea: coveredArea,
      mortarArea: mortarArea, mortarWet: mortarWet, mortarDry: mortarDry, mortarTotal: mortarTotal,
      cementCum: cementCum, cementBags: cementCum / i.bagVolume, sandCum: sandCum
    };
  }

  // rates: { brick: Rs per nos, cement: Rs per bag, sand: Rs per cum }. A missing rate gives null, never 0.
  function cost(result, rates) {
    var r = rates || {};
    function line(qty, rate) {
      var ok = typeof rate === 'number' && isFinite(rate) && rate >= 0;
      return { qty: qty, rate: ok ? rate : null, amount: ok ? qty * rate : null };
    }
    var lines = {
      brick: line(result.bricksSay, r.brick),
      cement: line(result.cementBags, r.cement),
      sand: line(result.sandCum, r.sand)
    };
    var complete = ['brick', 'cement', 'sand'].every(function (k) { return lines[k].amount !== null; });
    var total = complete ? lines.brick.amount + lines.cement.amount + lines.sand.amount : null;
    return { lines: lines, total: total, complete: complete };
  }


  // Reads the published rate list (materials.csv saved from the Excel "Website export" sheet).
  // Returns only rows that have an id, a material name and a numeric rate of 0 or more.
  function parseRates(text) {
    var rows = [], row = [], field = '', q = false, t = String(text || '').replace(/^\uFEFF/, '');
    for (var k = 0; k < t.length; k++) {
      var ch = t[k];
      if (q) {
        if (ch === '"') { if (t[k + 1] === '"') { field += '"'; k++; } else { q = false; } } else { field += ch; }
      } else if (ch === '"') { q = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && t[k + 1] === '\n') { k++; }
        row.push(field); field = ''; rows.push(row); row = [];
      } else { field += ch; }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) { return []; }
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var col = function (n) { return head.indexOf(n); };
    var out = [];
    rows.slice(1).forEach(function (r) {
      var rate = r[col('rate')] === undefined || r[col('rate')].trim() === '' ? NaN : Number(r[col('rate')]);
      var id = (r[col('id')] || '').trim(), name = (r[col('material')] || '').trim();
      if (!id || !name || !isFinite(rate) || rate < 0) { return; }
      out.push({ id: id, category: (r[col('category')] || '').trim(), material: name,
                 unit: (r[col('unit')] || '').trim(), rate: rate, rateDate: (r[col('rate_date')] || '').trim() });
    });
    return out;
  }

  // Whole days between an ISO date (yyyy-mm-dd) and today. Returns null if the date is missing or invalid.
  function rateAgeDays(iso, today) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) { return null; }
    var d = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    var n = today || new Date();
    return Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - d) / 86400000);
  }

  var api = { DEFAULTS: DEFAULTS, brickwork: brickwork, cost: cost, parseRates: parseRates, rateAgeDays: rateAgeDays };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.MaterialCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);

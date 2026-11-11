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

  var api = { DEFAULTS: DEFAULTS, brickwork: brickwork, cost: cost };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  root.MaterialCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);

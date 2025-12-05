/*
  Supply & Demand Interactive Simulator
  MATH 10 - U1 (2025) | Group 5: Bautista, Bulalacao, Selina
*/

const Q_MAX = 20;
const P_MAX = 20;
const MARGIN = 70;

let canvasHeight = 520;

// Theme / layout
let darkMode = true;
let tooltipItems = [];

// FONT SIZES (keep text consistent when legend toggles)
const BASE_FONT_SIZE = 14;     // main graph labels, axes, info panel
const LEGEND_FONT_SIZE = 12;   // legend entries
const TOOLTIP_FONT_SIZE = 12;  // tooltips + equilibrium bubbles

// Sliders and checkboxes
let aSlider, bSlider, demandShiftSlider;
let cSlider, dSlider, supplyShiftSlider;

let ceilingCheckbox, ceilingSlider;
let floorCheckbox, floorSlider;

let taxCheckbox, taxSlider;
let subsidyCheckbox, subsidySlider;

let animateCheckbox;
let themeButton;
let scenarioSelect;
let modeSelect;
let resetButton;
let showLegendCheckbox, showInfoCheckbox;

// Panels / containers
let demandBox, supplyBox;
let controlBar;
let watermarkDiv;

// layout helpers

function getCanvasWidth() {
  return windowWidth - 20;
}

function isMobileLayout() {
  // treat anything narrower than 1100px as “mobile” and stack panels
  return windowWidth < 1100;
}

function updateCanvasSize() {
  canvasHeight = min(520, windowHeight * 0.5);
  resizeCanvas(getCanvasWidth(), canvasHeight);
}

// theme

function applyTheme() {
  if (darkMode) {
    document.body.style.backgroundColor = "#111";
    document.body.style.color = "#eee";
  } else {
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#000000";
  }

  const controls = document.querySelectorAll("input, select, button");
  controls.forEach((el) => {
    if (darkMode) {
      el.style.backgroundColor = "#222";
      el.style.color = "#eee";
      el.style.borderColor = "#555";
    } else {
      el.style.backgroundColor = "";
      el.style.color = "";
      el.style.borderColor = "";
    }
  });

  const demandPanels = document.querySelectorAll(".slider-demand");
  demandPanels.forEach((p) => {
    if (darkMode) {
      p.style.backgroundColor = "rgba(35,45,70,0.95)";
      p.style.borderColor = "#5e7bb8";
      p.style.color = "#f3f6ff";
    } else {
      p.style.backgroundColor = "rgba(245,250,255,0.95)";
      p.style.borderColor = "#a9c8ff";
      p.style.color = "#000";
    }
  });

  const supplyPanels = document.querySelectorAll(".slider-supply");
  supplyPanels.forEach((p) => {
    if (darkMode) {
      p.style.backgroundColor = "rgba(70,35,35,0.95)";
      p.style.borderColor = "#d88484";
      p.style.color = "#fff5f5";
    } else {
      p.style.backgroundColor = "rgba(255,245,245,0.95)";
      p.style.borderColor = "#ffb3b3";
      p.style.color = "#000";
    }
  });

  const bars = document.querySelectorAll(".control-bar");
  bars.forEach((b) => {
    if (darkMode) {
      b.style.backgroundColor = "rgba(30,30,30,0.95)";
      b.style.borderColor = "#666";
      b.style.color = "#eee";
    } else {
      b.style.backgroundColor = "rgba(245,245,245,0.98)";
      b.style.borderColor = "#ccc";
      b.style.color = "#000";
    }
  });

  if (watermarkDiv) {
    watermarkDiv.style("opacity", "0.65");
    watermarkDiv.style("color", darkMode ? "#f0f0f0" : "#333333");
  }
}

// setup / draw

function setup() {
  canvasHeight = min(520, windowHeight * 0.5);
  createCanvas(getCanvasWidth(), canvasHeight);
  textFont("sans-serif");

  createDemandControls();
  createSupplyControls();
  createPolicyControls();
  createGlobalControls();
  createWatermark();

  scenarioSelect.value("baseline");
  resetDefaults();

  layoutUI();
  applyTheme();
}

function draw() {
  // Reset base font size every frame so nothing “sticks”
  textSize(BASE_FONT_SIZE);

  background(darkMode ? 20 : 255);
  tooltipItems = [];

  drawAxes();
  if (showLegendCheckbox.checked()) drawLegend();

  const a = aSlider.value();
  const b = bSlider.value();
  const c = cSlider.value();
  const d = dSlider.value();

  const baseDShift = demandShiftSlider.value();
  const baseSShift = supplyShiftSlider.value();

  let dShift = baseDShift;
  let sShift = baseSShift;

  if (animateCheckbox.checked()) {
    const t = frameCount * 0.02;
    const wiggle = 2 * sin(t);
    dShift = baseDShift + wiggle;
    sShift = baseSShift - wiggle;
  }

  const aBase = a + dShift;
  const cBase = c + sShift;

  const tax = taxCheckbox.checked() ? taxSlider.value() : 0;
  const subsidy = subsidyCheckbox.checked() ? subsidySlider.value() : 0;
  const cPolicy = cBase + tax - subsidy;

  drawCurves(aBase, b, cBase, d, cPolicy, tax, subsidy);

  const eqBase = computeEquilibrium(aBase, b, cBase, d);
  const eqPolicy = computeEquilibrium(aBase, b, cPolicy, d);

  if (eqBase) {
    drawEquilibriumDot(eqBase, "Starting equilibrium", color(150), "below");
  }
  if (eqBase && eqPolicy) {
    const dq = Math.abs(eqPolicy.Qe - eqBase.Qe);
    const dp = Math.abs(eqPolicy.Pe - eqBase.Pe);
    if (dq > 0.05 || dp > 0.05) {
      drawEquilibriumDot(
        eqPolicy,
        "New equilibrium",
        darkMode ? color(255) : color(0),
        "above"
      );
    }
  }

  drawPriceControls(aBase, b, cPolicy, d, eqPolicy);
  drawTaxSubsidyWedge(aBase, b, cBase, cPolicy, d, eqPolicy, tax, subsidy);

  if (showInfoCheckbox.checked()) {
    drawInfoPanel(
      a,
      b,
      c,
      d,
      dShift,
      sShift,
      tax,
      subsidy,
      eqBase,
      eqPolicy
    );
  }

  drawTooltip();
}

function windowResized() {
  updateCanvasSize();
  layoutUI();
  positionWatermark();
}

// UI creation

function createDemandControls() {
  const baseY = canvasHeight + 20;

  demandBox = createDiv();
  demandBox.position(20, baseY);
  demandBox.addClass("slider-panel");
  demandBox.addClass("slider-demand");
  demandBox.style("padding", "10px 16px 12px 16px");
  demandBox.style("border-radius", "12px");
  demandBox.style("border", "1px solid #a9c8ff");
  demandBox.style("min-width", "330px");
  demandBox.style("font-size", "13px");

  const title = createElement("div", "👤 DEMAND (BUYERS)");
  title.parent(demandBox);
  title.style("font-weight", "bold");
  title.style("letter-spacing", "0.5px");
  title.style("margin-bottom", "4px");

  const rule = createElement("div", "");
  rule.parent(demandBox);
  rule.style("border-bottom", "1px solid #ddd");
  rule.style("margin", "2px 0 6px 0");

  const interceptLabel = createElement(
    "div",
    "Start price — moves the blue line up or down"
  );
  interceptLabel.parent(demandBox);
  interceptLabel.style("margin-bottom", "2px");

  aSlider = createSlider(10, 30, 22, 1);
  aSlider.parent(demandBox);
  aSlider.style("width", "300px");
  aSlider.style("margin-bottom", "6px");

  const slopeLabel = createElement(
    "div",
    "Tilt — how quickly price falls as quantity rises"
  );
  slopeLabel.parent(demandBox);
  slopeLabel.style("margin-bottom", "2px");

  bSlider = createSlider(0.5, 3, 1, 0.1);
  bSlider.parent(demandBox);
  bSlider.style("width", "300px");
  bSlider.style("margin-bottom", "6px");

  const shiftLabel = createElement(
    "div",
    "Shift left or right — fewer or more buyers"
  );
  shiftLabel.parent(demandBox);
  shiftLabel.style("margin-bottom", "2px");

  demandShiftSlider = createSlider(-5, 5, 0, 0.5);
  demandShiftSlider.parent(demandBox);
  demandShiftSlider.style("width", "300px");
  demandShiftSlider.style("margin-bottom", "2px");
}

function createSupplyControls() {
  const baseY = canvasHeight + 20;

  supplyBox = createDiv();
  supplyBox.position(420, baseY);
  supplyBox.addClass("slider-panel");
  supplyBox.addClass("slider-supply");
  supplyBox.style("padding", "10px 16px 12px 16px");
  supplyBox.style("border-radius", "12px");
  supplyBox.style("border", "1px solid #ffb3b3");
  supplyBox.style("min-width", "330px");
  supplyBox.style("font-size", "13px");

  const title = createElement("div", "🏭 SUPPLY (SELLERS)");
  title.parent(supplyBox);
  title.style("font-weight", "bold");
  title.style("letter-spacing", "0.5px");
  title.style("margin-bottom", "4px");

  const rule = createElement("div", "");
  rule.parent(supplyBox);
  rule.style("border-bottom", "1px solid #ddd");
  rule.style("margin", "2px 0 6px 0");

  const interceptLabel = createElement(
    "div",
    "Start price — moves the red line up or down"
  );
  interceptLabel.parent(supplyBox);
  interceptLabel.style("margin-bottom", "2px");

  cSlider = createSlider(0, 15, 6, 1);
  cSlider.parent(supplyBox);
  cSlider.style("width", "300px");
  cSlider.style("margin-bottom", "6px");

  const slopeLabel = createElement(
    "div",
    "Tilt — how quickly price rises as quantity rises"
  );
  slopeLabel.parent(supplyBox);
  slopeLabel.style("margin-bottom", "2px");

  dSlider = createSlider(0.5, 3, 1, 0.1);
  dSlider.parent(supplyBox);
  dSlider.style("width", "300px");
  dSlider.style("margin-bottom", "6px");

  const shiftLabel = createElement(
    "div",
    "Shift left or right — fewer or more sellers"
  );
  shiftLabel.parent(supplyBox);
  shiftLabel.style("margin-bottom", "2px");

  supplyShiftSlider = createSlider(-5, 5, 0, 0.5);
  supplyShiftSlider.parent(supplyBox);
  supplyShiftSlider.style("width", "300px");
  supplyShiftSlider.style("margin-bottom", "2px");
}

function createPolicyControls() {
  ceilingCheckbox = createCheckbox("Turn on max price (ceiling)", false);
  ceilingSlider = createSlider(0, P_MAX, 8, 0.5);

  floorCheckbox = createCheckbox("Turn on min price (floor)", false);
  floorSlider = createSlider(0, P_MAX, 5, 0.5);

  taxCheckbox = createCheckbox("Add a tax to sellers", false);
  taxSlider = createSlider(0, 10, 2, 0.5);

  subsidyCheckbox = createCheckbox("Give sellers a subsidy", false);
  subsidySlider = createSlider(0, 10, 2, 0.5);
}

function createGlobalControls() {
  animateCheckbox = createCheckbox("Animate shifts over time", false);

  themeButton = createButton("Toggle dark / light theme");
  themeButton.mousePressed(() => {
    darkMode = !darkMode;
    applyTheme();
  });

  scenarioSelect = createSelect();
  scenarioSelect.option("Free play (manual)", "custom");
  scenarioSelect.option("Normal market", "baseline");
  scenarioSelect.option("More buyers arrive", "demand_boom");
  scenarioSelect.option("Bad harvest (less supply)", "supply_shock");
  scenarioSelect.option("Max price (ceiling)", "ceiling");
  scenarioSelect.option("Min price (floor)", "floor");
  scenarioSelect.option("Tax on sellers", "tax");
  scenarioSelect.option("Subsidy for sellers", "subsidy");
  scenarioSelect.changed(applyScenario);

  modeSelect = createSelect();
  modeSelect.option("Simple mode", "kids");
  modeSelect.option("Pro mode", "pro");
  modeSelect.value("kids");

  resetButton = createButton("Reset to default");
  resetButton.mousePressed(resetDefaults);

  showLegendCheckbox = createCheckbox("Show legend", true);
  showInfoCheckbox = createCheckbox("Show info panel", false);

  controlBar = createDiv();
  controlBar.addClass("control-bar");
  controlBar.style("padding", "8px 14px");
  controlBar.style("border-radius", "10px");
  controlBar.style("border", "1px solid #ccc");
  controlBar.style("display", "inline-block");
  controlBar.style("font-size", "13px");
  controlBar.style("white-space", "nowrap");

  animateCheckbox.parent(controlBar);
  animateCheckbox.style("margin-right", "18px");

  themeButton.parent(controlBar);
  themeButton.style("margin-right", "18px");

  scenarioSelect.parent(controlBar);
  scenarioSelect.style("margin-right", "18px");

  modeSelect.parent(controlBar);
  modeSelect.style("margin-right", "18px");

  resetButton.parent(controlBar);
  resetButton.style("margin-right", "8px");

  const lineBreak = createElement("div", "");
  lineBreak.parent(controlBar);
  lineBreak.style("height", "6px");

  showLegendCheckbox.parent(controlBar);
  showLegendCheckbox.style("margin-right", "18px");

  showInfoCheckbox.parent(controlBar);
}

function createWatermark() {
  watermarkDiv = createDiv(
    "MATH 10 - U1 (2025) | Group 5: Bautista, Bulalacao, Selina"
  );
  watermarkDiv.style("font-size", "11px");
  watermarkDiv.style("position", "fixed");
  watermarkDiv.style("pointer-events", "none");
}

// layout (desktop vs mobile)

function layoutUI() {
  const mobile = isMobileLayout();
  const baseY = canvasHeight + 20;

  if (mobile) {
    let x = 10;
    let y = baseY;

    demandBox.position(x, y);
    y += demandBox.elt.offsetHeight + 10;

    supplyBox.position(x, y);
    y += supplyBox.elt.offsetHeight + 15;

    ceilingCheckbox.position(x, y);
    ceilingSlider.position(x + 10, y + 20);
    y += 55;

    floorCheckbox.position(x, y);
    floorSlider.position(x + 10, y + 20);
    y += 55;

    taxCheckbox.position(x, y);
    taxSlider.position(x + 10, y + 20);
    y += 55;

    subsidyCheckbox.position(x, y);
    subsidySlider.position(x + 10, y + 20);
    y += 70;

    controlBar.position(x, y);
  } else {
    demandBox.position(20, baseY);
    supplyBox.position(420, baseY);

    const baseXRight = 780;

    ceilingCheckbox.position(baseXRight, baseY - 5);
    ceilingSlider.position(baseXRight, baseY + 20);

    floorCheckbox.position(baseXRight, baseY + 60);
    floorSlider.position(baseXRight, baseY + 85);

    taxCheckbox.position(baseXRight + 240, baseY - 5);
    taxSlider.position(baseXRight + 240, baseY + 20);

    subsidyCheckbox.position(baseXRight + 240, baseY + 60);
    subsidySlider.position(baseXRight + 240, baseY + 85);

    controlBar.position(20, baseY + 160);
  }

  positionWatermark();
}

function positionWatermark() {
  if (!watermarkDiv) return;
  const w = watermarkDiv.elt.offsetWidth || 0;
  watermarkDiv.position(windowWidth - 20 - w, windowHeight - 24);
  watermarkDiv.style("opacity", "0.65");
}

// axes, legend, econ helpers

function drawAxes() {
  stroke(darkMode ? 220 : 0);
  strokeWeight(1);

  line(MARGIN, MARGIN, MARGIN, height - MARGIN);
  line(MARGIN, height - MARGIN, width - MARGIN, height - MARGIN);

  // Axis labels
  noStroke();
  fill(darkMode ? 230 : 0);

  push();
  textSize(BASE_FONT_SIZE + 2);
  textAlign(CENTER, CENTER);
  text("Quantity (Q)", width / 2, height - MARGIN + 35);
  pop();

  push();
  textSize(BASE_FONT_SIZE + 2);
  translate(MARGIN - 40, height / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text("Price (P)", 0, 0);
  pop();

  // Tick labels
  push();
  textSize(BASE_FONT_SIZE - 4);

  for (let q = 0; q <= Q_MAX; q += 5) {
    const v = econToScreen(q, 0);
    stroke(darkMode ? 220 : 0);
    line(v.x, v.y - 4, v.x, v.y + 4);
    noStroke();
    fill(darkMode ? 220 : 0);
    textAlign(CENTER, TOP);
    text(q, v.x, v.y + 8);
  }

  for (let p = 0; p <= P_MAX; p += 5) {
    const v = econToScreen(0, p);
    stroke(darkMode ? 220 : 0);
    line(v.x - 4, v.y, v.x + 4, v.y);
    noStroke();
    fill(darkMode ? 220 : 0);
    textAlign(RIGHT, CENTER);
    text(p, v.x - 6, v.y);
  }
  pop();
}

function drawLegend() {
  push();

  let x0 = MARGIN + 10;
  let y0 = MARGIN + 10;
  const len = 25;

  textAlign(LEFT, CENTER);
  textSize(LEGEND_FONT_SIZE);

  stroke(80, 150, 255);
  strokeWeight(2);
  line(x0, y0, x0 + len, y0);
  noStroke();
  fill(darkMode ? 240 : 0);
  text("Demand curve (buyers)", x0 + len + 5, y0);

  y0 += 18;
  stroke(255, 120, 120);
  drawingContext.setLineDash([5, 4]);
  line(x0, y0, x0 + len, y0);
  drawingContext.setLineDash([]);
  noStroke();
  text("Supply curve (sellers)", x0 + len + 5, y0);

  y0 += 18;
  stroke(255, 180, 60);
  line(x0, y0, x0 + len, y0);
  noStroke();
  text("Supply after tax or subsidy", x0 + len + 5, y0);

  y0 += 18;
  stroke(160);
  line(x0, y0, x0 + len, y0);
  noStroke();
  text("Price rule (ceiling or floor)", x0 + len + 5, y0);

  y0 += 18;
  stroke(120, 0, 200);
  line(x0, y0, x0 + len, y0);
  noStroke();
  text("Tax or subsidy gap", x0 + len + 5, y0);

  pop();
}

function econToScreen(Q, P) {
  const x = map(Q, 0, Q_MAX, MARGIN, width - MARGIN);
  const y = map(P, 0, P_MAX, height - MARGIN, MARGIN);
  return createVector(x, y);
}

function demandPrice(Q, aIntercept, b) {
  return aIntercept - b * Q;
}

function supplyPrice(Q, cIntercept, d) {
  return cIntercept + d * Q;
}

function computeEquilibrium(aIntercept, b, cIntercept, d) {
  const denom = b + d;
  if (denom === 0) return null;

  const Qe = (aIntercept - cIntercept) / denom;
  const Pe = demandPrice(Qe, aIntercept, b);

  if (Qe < 0 || Qe > Q_MAX || Pe < 0 || Pe > P_MAX) return null;
  return { Qe, Pe };
}

// curves + equilibrium points

function drawCurves(aBase, b, cBase, d, cPolicy, tax, subsidy) {
  stroke(80, 150, 255);
  strokeWeight(2);
  let last = null;
  for (let Q = 0; Q <= Q_MAX; Q += 0.1) {
    const P = demandPrice(Q, aBase, b);
    if (P < 0 || P > P_MAX) continue;
    const v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }

  stroke(255, 120, 120);
  drawingContext.setLineDash([5, 5]);
  last = null;
  for (let Q = 0; Q <= Q_MAX; Q += 0.1) {
    const P = supplyPrice(Q, cBase, d);
    if (P < 0 || P > P_MAX) continue;
    const v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }
  drawingContext.setLineDash([]);

  if (tax > 0 || subsidy > 0) {
    stroke(255, 180, 60);
    strokeWeight(2);
    last = null;
    for (let Q = 0; Q <= Q_MAX; Q += 0.1) {
      const P = supplyPrice(Q, cPolicy, d);
      if (P < 0 || P > P_MAX) continue;
      const v = econToScreen(Q, P);
      if (last) line(last.x, last.y, v.x, v.y);
      last = v;
    }
  } else {
    stroke(255, 80, 80);
    strokeWeight(2);
    last = null;
    for (let Q = 0; Q <= Q_MAX; Q += 0.1) {
      const P = supplyPrice(Q, cBase, d);
      if (P < 0 || P > P_MAX) continue;
      const v = econToScreen(Q, P);
      if (last) line(last.x, last.y, v.x, v.y);
      last = v;
    }
  }
}

function drawEquilibriumDot(eq, label, col, verticalPosition) {
  const v = econToScreen(eq.Qe, eq.Pe);

  fill(col);
  noStroke();
  ellipse(v.x, v.y, 10, 10);

  const textString = `${label} (Q ≈ ${eq.Qe.toFixed(2)}, P ≈ ${eq.Pe.toFixed(
    2
  )})`;

  const yOffset = verticalPosition === "below" ? 14 : -14;
  const tx = v.x + 8;
  const ty = v.y + yOffset;

  push();
  textSize(TOOLTIP_FONT_SIZE);
  const w = textWidth(textString) + 6;
  noStroke();
  fill(darkMode ? 20 : 255, 230);
  rect(tx - 3, ty - 9, w, 18, 4);
  fill(darkMode ? 255 : 0);
  textAlign(LEFT, CENTER);
  text(textString, tx, ty);
  pop();
}

// price controls (ceiling / floor)

function drawPriceControls(aBase, b, cPolicy, d, eq) {
  if (!eq) return;

  if (ceilingCheckbox.checked()) {
    const Pc = ceilingSlider.value();
    const left = econToScreen(0, Pc);
    const right = econToScreen(Q_MAX, Pc);

    stroke(160);
    strokeWeight(1.5);
    line(left.x, left.y, right.x, right.y);

    noStroke();
    fill(darkMode ? 240 : 0);
    textAlign(RIGHT, BOTTOM);
    text(`Max price = ${Pc.toFixed(2)}`, right.x - 10, right.y - 6);

    const Qd_c = (aBase - Pc) / b;
    const Qs_c = (Pc - cPolicy) / d;

    if (Qd_c >= 0 && Qd_c <= Q_MAX) {
      const vd = econToScreen(Qd_c, Pc);
      fill(80, 150, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Demand at max price", vd.x, vd.y + 5);
      addTooltip(vd.x, vd.y, `Demand at max price: Q ≈ ${Qd_c.toFixed(2)}`);
    }

    if (Qs_c >= 0 && Qs_c <= Q_MAX) {
      const vs = econToScreen(Qs_c, Pc);
      fill(255, 80, 80);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Supply at max price", vs.x, vs.y + 5);
      addTooltip(vs.x, vs.y, `Supply at max price: Q ≈ ${Qs_c.toFixed(2)}`);
    }

    if (Pc < eq.Pe) {
      const shortage = Qd_c - Qs_c;
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        `Max price is below the balance price → shortage ≈ ${shortage.toFixed(
          2
        )} units`,
        MARGIN + 10,
        MARGIN + 10
      );

      const leftQ = max(0, min(Qd_c, Qs_c));
      const rightQ = min(Q_MAX, max(Qd_c, Qs_c));
      const p1 = econToScreen(leftQ, Pc);
      const p2 = econToScreen(rightQ, Pc);
      const p3 = econToScreen(rightQ, Pc - 0.4);
      const p4 = econToScreen(leftQ, Pc - 0.4);

      noStroke();
      fill(80, 150, 255, 60);
      beginShape();
      vertex(p1.x, p1.y);
      vertex(p2.x, p2.y);
      vertex(p3.x, p3.y);
      vertex(p4.x, p4.y);
      endShape(CLOSE);
    } else {
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        "Max price is at or above the balance price → no shortage created",
        MARGIN + 10,
        MARGIN + 10
      );
    }
  }

  if (floorCheckbox.checked()) {
    const Pf = floorSlider.value();
    const left = econToScreen(0, Pf);
    const right = econToScreen(Q_MAX, Pf);

    stroke(200, 120, 0);
    strokeWeight(1.5);
    line(left.x, left.y, right.x, right.y);

    noStroke();
    fill(darkMode ? 255 : 0);
    textAlign(RIGHT, TOP);
    text(`Min price = ${Pf.toFixed(2)}`, right.x - 10, right.y + 3);

    const Qd_f = (aBase - Pf) / b;
    const Qs_f = (Pf - cPolicy) / d;

    if (Qd_f >= 0 && Qd_f <= Q_MAX) {
      const vd = econToScreen(Qd_f, Pf);
      fill(80, 150, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Demand at min price", vd.x, vd.y + 5);
      addTooltip(vd.x, vd.y, `Demand at min price: Q ≈ ${Qd_f.toFixed(2)}`);
    }

    if (Qs_f >= 0 && Qs_f <= Q_MAX) {
      const vs = econToScreen(Qs_f, Pf);
      fill(255, 80, 80);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Supply at min price", vs.x, vs.y + 5);
      addTooltip(vs.x, vs.y, `Supply at min price: Q ≈ ${Qs_f.toFixed(2)}`);
    }

    if (Pf > eq.Pe) {
      const surplus = Qs_f - Qd_f;
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        `Min price is above the balance price → surplus ≈ ${surplus.toFixed(
          2
        )} units`,
        MARGIN + 10,
        MARGIN + 30
      );

      const leftQ = max(0, min(Qd_f, Qs_f));
      const rightQ = min(Q_MAX, max(Qd_f, Qs_f));
      const p1 = econToScreen(leftQ, Pf);
      const p2 = econToScreen(rightQ, Pf);
      const p3 = econToScreen(rightQ, Pf + 0.4);
      const p4 = econToScreen(leftQ, Pf + 0.4);

      noStroke();
      fill(255, 80, 80, 60);
      beginShape();
      vertex(p1.x, p1.y);
      vertex(p2.x, p2.y);
      vertex(p3.x, p3.y);
      vertex(p4.x, p4.y);
      endShape(CLOSE);
    } else {
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        "Min price is at or below the balance price → no surplus created",
        MARGIN + 10,
        MARGIN + 30
      );
    }
  }
}

// tax / subsidy wedge

function drawTaxSubsidyWedge(aBase, b, cBase, cPolicy, d, eq, tax, subsidy) {
  if (!eq) return;
  if (tax <= 0 && subsidy <= 0) return;

  const Qe = eq.Qe;
  const Pd = demandPrice(Qe, aBase, b);
  const Pp = supplyPrice(Qe, cBase, d);

  const vPd = econToScreen(Qe, Pd);
  const vPp = econToScreen(Qe, Pp);

  stroke(120, 0, 200);
  strokeWeight(2);
  line(vPd.x, vPd.y, vPp.x, vPp.y);

  noStroke();
  fill(120, 0, 200, 80);
  const band = 0.3;
  const vPd2 = econToScreen(Qe + band, Pd);
  const vPp2 = econToScreen(Qe + band, Pp);
  beginShape();
  vertex(vPd.x, vPd.y);
  vertex(vPd2.x, vPd2.y);
  vertex(vPp2.x, vPp2.y);
  vertex(vPp.x, vPp.y);
  endShape(CLOSE);

  let label;
  if (tax > 0 && subsidy <= 0) {
    label = `Tax gap ≈ ${tax.toFixed(2)} per unit`;
  } else if (subsidy > 0 && tax <= 0) {
    label = `Subsidy gap ≈ ${subsidy.toFixed(2)} per unit`;
  } else {
    label = `Net gap ≈ ${(tax - subsidy).toFixed(2)} per unit`;
  }

  fill(darkMode ? 255 : 0);
  textAlign(LEFT, BOTTOM);
  text(label, vPd.x + 10, (vPd.y + vPp.y) / 2);

  addTooltip(
    (vPd.x + vPp.x) / 2,
    (vPd.y + vPp.y) / 2,
    `${label}\nBuyer price ≈ ${Pd.toFixed(2)}, seller price ≈ ${Pp.toFixed(2)}`
  );
}

// info panel (simple / pro)

function drawInfoPanel(
  a,
  b,
  c,
  d,
  dShift,
  sShift,
  tax,
  subsidy,
  eqBase,
  eqPolicy
) {
  const x0 = width - 360;
  let y = MARGIN;
  const mode = modeSelect ? modeSelect.value() : "kids";

  push();
  fill(darkMode ? 255 : 0);
  textSize(BASE_FONT_SIZE - 1);
  textAlign(LEFT, TOP);

  if (mode === "kids") {
    text("Blue line: buyers (demand).", x0, y);
    y += 18;
    text("Red line: sellers (supply).", x0, y);
    y += 18;
    text("The dot shows a fair price and quantity.", x0, y);
    y += 22;

    text(`Move buyers: demand shift = ${dShift.toFixed(1)}`, x0, y);
    y += 18;
    text(`Move sellers: supply shift = ${sShift.toFixed(1)}`, x0, y);
    y += 18;
    text(`Tax = ${tax.toFixed(1)}, subsidy = ${subsidy.toFixed(1)}`, x0, y);
    y += 22;

    if (eqBase) {
      text(
        `Start: price ≈ ${eqBase.Pe.toFixed(
          2
        )}, quantity ≈ ${eqBase.Qe.toFixed(2)}`,
        x0,
        y
      );
      y += 18;
    }
    if (eqPolicy) {
      text(
        `After policy: price ≈ ${eqPolicy.Pe.toFixed(
          2
        )}, quantity ≈ ${eqPolicy.Qe.toFixed(2)}`,
        x0,
        y
      );
    }
  } else {
    text(
      `Demand: price = (${a.toFixed(1)} + shift) − ${b.toFixed(2)} × Q`,
      x0,
      y
    );
    y += 20;

    text(
      `Supply: price = (${c.toFixed(
        1
      )} + shift + tax − subsidy) + ${d.toFixed(2)} × Q`,
      x0,
      y
    );
    y += 24;

    text("P = price, Q = quantity. The dot is where they agree.", x0, y);
    y += 26;

    text(
      `Demand shift = ${dShift.toFixed(1)}, supply shift = ${sShift.toFixed(
        1
      )}`,
      x0,
      y
    );
    y += 20;

    text(`Tax = ${tax.toFixed(1)}, subsidy = ${subsidy.toFixed(1)}`, x0, y);
    y += 22;

    if (eqBase) {
      text(
        `Start: price ≈ ${eqBase.Pe.toFixed(
          2
        )}, quantity ≈ ${eqBase.Qe.toFixed(2)}`,
        x0,
        y
      );
      y += 20;
    }
    if (eqPolicy) {
      text(
        `After policy: price ≈ ${eqPolicy.Pe.toFixed(
          2
        )}, quantity ≈ ${eqPolicy.Qe.toFixed(2)}`,
        x0,
        y
      );
    }
  }

  pop();
}

// tooltip helpers

function addTooltip(x, y, label) {
  tooltipItems.push({ x, y, label });
}

function drawTooltip() {
  let closest = null;
  let minDist = 18;

  for (const item of tooltipItems) {
    const d = dist(mouseX, mouseY, item.x, item.y);
    if (d < minDist) {
      minDist = d;
      closest = item;
    }
  }
  if (!closest) return;

  push();
  textSize(TOOLTIP_FONT_SIZE);

  const lines = closest.label.split("\n");
  let w = 0;
  for (const line of lines) w = max(w, textWidth(line));
  const h = lines.length * 16 + 6;

  let bx = closest.x + 12;
  let by = closest.y - h - 10;
  bx = constrain(bx, MARGIN, width - MARGIN - w - 10);
  by = constrain(by, MARGIN, height - MARGIN - h - 10);

  fill(darkMode ? 40 : 245);
  stroke(darkMode ? 220 : 0);
  rect(bx, by, w + 10, h, 5);

  noStroke();
  fill(darkMode ? 255 : 0);
  let ty = by + 14;
  for (const line of lines) {
    text(line, bx + 5, ty);
    ty += 16;
  }

  pop();
}

// scenarios / reset
function resetDefaults() {
  aSlider.value(22);
  bSlider.value(1);
  demandShiftSlider.value(0);

  cSlider.value(6);
  dSlider.value(1);
  supplyShiftSlider.value(0);

  ceilingCheckbox.checked(false);
  floorCheckbox.checked(false);
  taxCheckbox.checked(false);
  subsidyCheckbox.checked(false);

  ceilingSlider.value(8);
  floorSlider.value(16);
  taxSlider.value(7);
  subsidySlider.value(7);

  animateCheckbox.checked(false);
}

function applyScenario() {
  const s = scenarioSelect.value();
  resetDefaults();

  switch (s) {
    case "baseline":
      break;
    case "demand_boom":
      demandShiftSlider.value(4);
      break;
    case "supply_shock":
      supplyShiftSlider.value(4);
      break;
    case "ceiling":
      ceilingCheckbox.checked(true);
      ceilingSlider.value(10);
      break;
    case "floor":
      floorCheckbox.checked(true);
      floorSlider.value(16);
      break;
    case "tax":
      taxCheckbox.checked(true);
      taxSlider.value(7);
      break;
    case "subsidy":
      taxCheckbox.checked(false);
      subsidyCheckbox.checked(true);
      subsidySlider.value(7);
      break;
    case "custom":
    default:
      break;
  }

  scenarioSelect.value(s);
}

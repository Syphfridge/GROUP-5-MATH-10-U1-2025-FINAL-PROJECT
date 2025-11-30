// Supply and Demand Simulation – Simple or Pro mode with polished layout

// --- GLOBAL SETTINGS ---
let canvasHeight = 520;
let margin = 70;
let Qmax = 20;
let Pmax = 20;

// Controls
let aSlider, bSlider, cSlider, dSlider;
let demandShiftSlider, supplyShiftSlider;

let ceilingCheckbox, ceilingSlider;
let floorCheckbox, floorSlider;

let taxCheckbox, taxSlider;
let subsidyCheckbox, subsidySlider;

let animateCheckbox;
let themeButton;
let scenarioSelect;
let modeSelect; // Simple / Pro mode
let resetButton;

let showLegendCheckbox, showInfoCheckbox;

let demandBox, supplyBox;
let controlBar;
let watermarkDiv; // DOM watermark

// Dark mode starts as true
let darkMode = true;
let tooltipItems = [];

// ---------- Responsive canvas width ----------
function getCanvasWidth() {
  return windowWidth - 20;
}

// ---------- Theme helper ----------
function applyTheme() {
  if (darkMode) {
    document.body.style.backgroundColor = "#111";
    document.body.style.color = "#eee";
  } else {
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#000000";
  }

  // Style inputs
  let inputs = document.querySelectorAll("input, select, button");
  inputs.forEach((el) => {
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

  // Demand panels (blue)
  let demandPanels = document.querySelectorAll(".slider-demand");
  demandPanels.forEach((p) => {
    if (darkMode) {
      p.style.backgroundColor = "rgba(35, 45, 70, 0.95)";
      p.style.borderColor = "#5e7bb8";
      p.style.color = "#f3f6ff";
    } else {
      p.style.backgroundColor = "rgba(245, 250, 255, 0.95)";
      p.style.borderColor = "#a9c8ff";
      p.style.color = "#000";
    }
  });

  // Supply panels (red)
  let supplyPanels = document.querySelectorAll(".slider-supply");
  supplyPanels.forEach((p) => {
    if (darkMode) {
      p.style.backgroundColor = "rgba(70, 35, 35, 0.95)";
      p.style.borderColor = "#d88484";
      p.style.color = "#fff5f5";
    } else {
      p.style.backgroundColor = "rgba(255, 245, 245, 0.95)";
      p.style.borderColor = "#ffb3b3";
      p.style.color = "#000";
    }
  });

  // Control bar
  let bars = document.querySelectorAll(".control-bar");
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

  // Watermark color
  if (watermarkDiv) {
    watermarkDiv.style("opacity", "0.65");
    if (darkMode) {
      watermarkDiv.style("color", "#f0f0f0");
    } else {
      watermarkDiv.style("color", "#333333");
    }
  }
}

function setup() {
  createCanvas(getCanvasWidth(), canvasHeight);
  textFont("sans-serif");

  // --- Sliders for demand and supply ---
  aSlider = createSlider(10, 30, 22, 1);
  bSlider = createSlider(0.5, 3, 1, 0.1);
  demandShiftSlider = createSlider(-5, 5, 0, 0.5);

  cSlider = createSlider(0, 15, 6, 1);
  dSlider = createSlider(0.5, 3, 1, 0.1);
  supplyShiftSlider = createSlider(-5, 5, 0, 0.5);

  // --- Price controls ---
  ceilingCheckbox = createCheckbox("Turn on max price (ceiling)", false);
  ceilingSlider = createSlider(0, Pmax, 8, 0.5);

  floorCheckbox = createCheckbox("Turn on min price (floor)", false);
  floorSlider = createSlider(0, Pmax, 5, 0.5);

  // --- Tax and Subsidy ---
  taxCheckbox = createCheckbox("Add a tax to sellers", false);
  taxSlider = createSlider(0, 10, 2, 0.5);

  subsidyCheckbox = createCheckbox("Give sellers a subsidy", false);
  subsidySlider = createSlider(0, 10, 2, 0.5);

  // --- Animation and Theme ---
  animateCheckbox = createCheckbox("Animate shifts over time", false);
  themeButton = createButton("Toggle dark / light theme");
  themeButton.mousePressed(() => {
    darkMode = !darkMode;
    applyTheme();
  });

  // --- Scenario selector ---
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

  // --- Mode selector (Simple or Pro) ---
  modeSelect = createSelect();
  modeSelect.option("Simple mode", "kids"); // label updated here
  modeSelect.option("Pro mode", "pro");
  modeSelect.value("kids");

  resetButton = createButton("Reset to default");
  resetButton.mousePressed(resetDefaults);

  // --- Legend and info toggles ---
  showLegendCheckbox = createCheckbox("Show legend", true);
  showInfoCheckbox = createCheckbox("Show info panel", true);

  // Layout
  let baseY = canvasHeight + 20;

  // DEMAND panel
  demandBox = createDiv();
  demandBox.position(20, baseY);
  demandBox.addClass("slider-panel");
  demandBox.addClass("slider-demand");
  demandBox.style("padding", "10px 16px 12px 16px");
  demandBox.style("border-radius", "12px");
  demandBox.style("border", "1px solid #a9c8ff");
  demandBox.style("min-width", "330px");
  demandBox.style("font-size", "13px");

  let dTitle = createElement("div", "👤 DEMAND (BUYERS)");
  dTitle.parent(demandBox);
  dTitle.style("font-weight", "bold");
  dTitle.style("letter-spacing", "0.5px");
  dTitle.style("margin-bottom", "4px");

  let dRule = createElement("div", "");
  dRule.parent(demandBox);
  dRule.style("border-bottom", "1px solid #ddd");
  dRule.style("margin", "2px 0 6px 0");

  let dIntLabel = createElement(
    "div",
    "Start price — moves the blue line up or down"
  );
  dIntLabel.parent(demandBox);
  dIntLabel.style("margin-bottom", "2px");

  aSlider.parent(demandBox);
  aSlider.style("width", "300px");
  aSlider.style("margin-bottom", "6px");

  let dSlopeLabel = createElement(
    "div",
    "Tilt — how quickly price falls as quantity rises"
  );
  dSlopeLabel.parent(demandBox);
  dSlopeLabel.style("margin-bottom", "2px");

  bSlider.parent(demandBox);
  bSlider.style("width", "300px");
  bSlider.style("margin-bottom", "6px");

  let dShiftLabel = createElement(
    "div",
    "Shift left or right — fewer or more buyers"
  );
  dShiftLabel.parent(demandBox);
  dShiftLabel.style("margin-bottom", "2px");

  demandShiftSlider.parent(demandBox);
  demandShiftSlider.style("width", "300px");
  demandShiftSlider.style("margin-bottom", "2px");

  // SUPPLY panel
  supplyBox = createDiv();
  supplyBox.position(420, baseY);
  supplyBox.addClass("slider-panel");
  supplyBox.addClass("slider-supply");
  supplyBox.style("padding", "10px 16px 12px 16px");
  supplyBox.style("border-radius", "12px");
  supplyBox.style("border", "1px solid #ffb3b3");
  supplyBox.style("min-width", "330px");
  supplyBox.style("font-size", "13px");

  let sTitle = createElement("div", "🏭 SUPPLY (SELLERS)");
  sTitle.parent(supplyBox);
  sTitle.style("font-weight", "bold");
  sTitle.style("letter-spacing", "0.5px");
  sTitle.style("margin-bottom", "4px");

  let sRule = createElement("div", "");
  sRule.parent(supplyBox);
  sRule.style("border-bottom", "1px solid #ddd");
  sRule.style("margin", "2px 0 6px 0");

  let sIntLabel = createElement(
    "div",
    "Start price — moves the red line up or down"
  );
  sIntLabel.parent(supplyBox);
  sIntLabel.style("margin-bottom", "2px");

  cSlider.parent(supplyBox);
  cSlider.style("width", "300px");
  cSlider.style("margin-bottom", "6px");

  let sSlopeLabel = createElement(
    "div",
    "Tilt — how quickly price rises as quantity rises"
  );
  sSlopeLabel.parent(supplyBox);
  sSlopeLabel.style("margin-bottom", "2px");

  dSlider.parent(supplyBox);
  dSlider.style("width", "300px");
  dSlider.style("margin-bottom", "6px");

  let sShiftLabel = createElement(
    "div",
    "Shift left or right — fewer or more sellers"
  );
  sShiftLabel.parent(supplyBox);
  sShiftLabel.style("margin-bottom", "2px");

  supplyShiftSlider.parent(supplyBox);
  supplyShiftSlider.style("width", "300px");
  supplyShiftSlider.style("margin-bottom", "2px");

  // Policy sliders and checkboxes on the right
  let baseXRight = 780;
  ceilingSlider.position(baseXRight, baseY + 20);
  floorSlider.position(baseXRight, baseY + 85);
  taxSlider.position(baseXRight + 240, baseY + 20);
  subsidySlider.position(baseXRight + 240, baseY + 85);

  ceilingCheckbox.position(baseXRight, baseY - 5);
  floorCheckbox.position(baseXRight, baseY + 60);
  taxCheckbox.position(baseXRight + 240, baseY - 5);
  subsidyCheckbox.position(baseXRight + 240, baseY + 60);

  // CONTROL BAR
  controlBar = createDiv();
  controlBar.position(20, baseY + 160);
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

  let lineBreak = createElement("div", "");
  lineBreak.parent(controlBar);
  lineBreak.style("height", "6px");

  showLegendCheckbox.parent(controlBar);
  showLegendCheckbox.style("margin-right", "18px");

  showInfoCheckbox.parent(controlBar);

  // WATERMARK (DOM element at very bottom-right of the window)
  watermarkDiv = createDiv(
    "MATH 10 - U1 (2025) | Group 5: Bautista, Bulalacao, Selina"
  );
  watermarkDiv.style("font-size", "11px");
  watermarkDiv.style("position", "fixed");
  watermarkDiv.style("pointer-events", "none");
  positionWatermark();

  scenarioSelect.value("baseline");
  resetDefaults();
  applyTheme();
}

function draw() {
  background(darkMode ? 20 : 255);
  tooltipItems = [];

  drawAxes();
  if (showLegendCheckbox.checked()) drawLegend();

  // Read slider values
  let a = aSlider.value();
  let b = bSlider.value();
  let c = cSlider.value();
  let d = dSlider.value();

  let baseDShift = demandShiftSlider.value();
  let baseSShift = supplyShiftSlider.value();

  let dShift = baseDShift;
  let sShift = baseSShift;

  // Back and forth animation for shifts
  if (animateCheckbox.checked()) {
    let t = frameCount * 0.02;
    let wiggle = 2 * sin(t);

    dShift = baseDShift + wiggle;
    sShift = baseSShift - wiggle;
  }

  let aBase = a + dShift;
  let cBase = c + sShift;

  let tax = taxCheckbox.checked() ? taxSlider.value() : 0;
  let subsidy = subsidyCheckbox.checked() ? subsidySlider.value() : 0;
  let cPolicy = cBase + tax - subsidy;

  drawCurves(aBase, b, cBase, d, cPolicy, tax, subsidy);

  // Compute both equilibria
  let eqBase = computeEquilibrium(aBase, b, cBase, d);
  let eqPolicy = computeEquilibrium(aBase, b, cPolicy, d);

  // Always show starting equilibrium
  if (eqBase) {
    drawEquilibriumPoint(
      eqBase,
      "Starting equilibrium",
      color(150),
      "below"
    );
  }

  // Show new equilibrium only if it actually changes
  if (eqBase && eqPolicy) {
    const dq = Math.abs(eqPolicy.Qe - eqBase.Qe);
    const dp = Math.abs(eqPolicy.Pe - eqBase.Pe);
    const changedEnough = dq > 0.05 || dp > 0.05;

    if (changedEnough) {
      drawEquilibriumPoint(
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
    drawParameterText(
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
  resizeCanvas(getCanvasWidth(), canvasHeight);
  positionWatermark();
}

// ----------------- AXES AND LEGEND -----------------

function drawAxes() {
  stroke(darkMode ? 220 : 0);
  strokeWeight(1);

  line(margin, margin, margin, height - margin);
  line(margin, height - margin, width - margin, height - margin);

  fill(darkMode ? 230 : 0);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Quantity (Q)", width / 2, height - margin + 35);

  push();
  translate(margin - 40, height / 2);
  rotate(-HALF_PI);
  text("Price (P)", 0, 0);
  pop();

  textSize(10);
  for (let q = 0; q <= Qmax; q += 5) {
    let v = econToScreen(q, 0);
    stroke(darkMode ? 220 : 0);
    line(v.x, v.y - 4, v.x, v.y + 4);
    noStroke();
    fill(darkMode ? 220 : 0);
    text(q, v.x, v.y + 14);
  }
  for (let p = 0; p <= Pmax; p += 5) {
    let v = econToScreen(0, p);
    stroke(darkMode ? 220 : 0);
    line(v.x - 4, v.y, v.x + 4, v.y);
    noStroke();
    fill(darkMode ? 220 : 0);
    text(p, v.x - 15, v.y);
  }
}

function drawLegend() {
  let x0 = margin + 10;
  let y0 = margin + 10;
  let lineLen = 25;

  textAlign(LEFT, CENTER);
  textSize(12);

  stroke(80, 150, 255);
  strokeWeight(2);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  fill(darkMode ? 240 : 0);
  text("Demand curve (buyers)", x0 + lineLen + 5, y0);

  y0 += 18;
  stroke(255, 120, 120);
  drawingContext.setLineDash([5, 4]);
  line(x0, y0, x0 + lineLen, y0);
  drawingContext.setLineDash([]);
  noStroke();
  text("Supply curve (sellers)", x0 + lineLen + 5, y0);

  y0 += 18;
  stroke(255, 180, 60);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  text("Supply after tax or subsidy", x0 + lineLen + 5, y0);

  y0 += 18;
  stroke(160);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  text("Price rule (ceiling or floor)", x0 + lineLen + 5, y0);

  y0 += 18;
  stroke(120, 0, 200);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  text("Tax or subsidy gap", x0 + lineLen + 5, y0);
}

// --------------- ECONOMY HELPERS -----------------

function econToScreen(Q, P) {
  let x = map(Q, 0, Qmax, margin, width - margin);
  let y = map(P, 0, Pmax, height - margin, margin);
  return createVector(x, y);
}

function demandPrice(Q, aIntercept, b) {
  return aIntercept - b * Q;
}

function supplyPrice(Q, cIntercept, d) {
  return cIntercept + d * Q;
}

function computeEquilibrium(aIntercept, b, cIntercept, d) {
  let denom = b + d;
  if (denom === 0) return null;
  let Qe = (aIntercept - cIntercept) / denom;
  let Pe = demandPrice(Qe, aIntercept, b);
  if (Qe < 0 || Qe > Qmax || Pe < 0 || Pe > Pmax) return null;
  return { Qe, Pe };
}

// --------------- CURVES AND EQUILIBRIA -----------------

function drawCurves(aBase, b, cBase, d, cPolicy, tax, subsidy) {
  // Demand line
  stroke(80, 150, 255);
  strokeWeight(2);
  let last = null;
  for (let Q = 0; Q <= Qmax; Q += 0.1) {
    let P = demandPrice(Q, aBase, b);
    if (P < 0 || P > Pmax) continue;
    let v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }

  // Base supply (dashed)
  stroke(255, 120, 120);
  drawingContext.setLineDash([5, 5]);
  last = null;
  for (let Q = 0; Q <= Qmax; Q += 0.1) {
    let P = supplyPrice(Q, cBase, d);
    if (P < 0 || P > Pmax) continue;
    let v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }
  drawingContext.setLineDash([]);

  // Policy supply or solid red if no policy
  if (tax > 0 || subsidy > 0) {
    stroke(255, 180, 60);
    strokeWeight(2);
    last = null;
    for (let Q = 0; Q <= Qmax; Q += 0.1) {
      let P = supplyPrice(Q, cPolicy, d);
      if (P < 0 || P > Pmax) continue;
      let v = econToScreen(Q, P);
      if (last) line(last.x, last.y, v.x, v.y);
      last = v;
    }
  } else {
    stroke(255, 80, 80);
    strokeWeight(2);
    last = null;
    for (let Q = 0; Q <= Qmax; Q += 0.1) {
      let P = supplyPrice(Q, cBase, d);
      if (P < 0 || P > Pmax) continue;
      let v = econToScreen(Q, P);
      if (last) line(last.x, last.y, v.x, v.y);
      last = v;
    }
  }
}

// Draw a labelled equilibrium dot, with label above or below
function drawEquilibriumPoint(eq, label, col, position) {
  let v = econToScreen(eq.Qe, eq.Pe);

  fill(col);
  noStroke();
  ellipse(v.x, v.y, 10, 10);

  textSize(12);
  textAlign(LEFT, CENTER);
  let yOffset = position === "below" ? 14 : -14;

  let txt = `${label} (Q ≈ ${eq.Qe.toFixed(2)}, P ≈ ${eq.Pe.toFixed(2)})`;
  let tw = textWidth(txt) + 6;
  let tx = v.x + 8;
  let ty = v.y + yOffset;

  push();
  noStroke();
  fill(darkMode ? 20 : 255, 230);
  rect(tx - 3, ty - 9, tw, 18, 4);
  fill(darkMode ? 255 : 0);
  text(txt, tx, ty);
  pop();
}

// --------------- PRICE CONTROLS -----------------

function drawPriceControls(aBase, b, cPolicy, d, eq) {
  if (!eq) return;

  // Ceiling
  if (ceilingCheckbox.checked()) {
    let Pc = ceilingSlider.value();
    let v1 = econToScreen(0, Pc);
    let v2 = econToScreen(Qmax, Pc);
    stroke(160);
    strokeWeight(1.5);
    line(v1.x, v1.y, v2.x, v2.y);

    noStroke();
    fill(darkMode ? 240 : 0);
    text(`Max price = ${Pc.toFixed(2)}`, v2.x - 140, v2.y - 15);

    let Qd_c = (aBase - Pc) / b;
    let Qs_c = (Pc - cPolicy) / d;

    if (Qd_c >= 0 && Qd_c <= Qmax) {
      let vd = econToScreen(Qd_c, Pc);
      fill(80, 150, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Demand at max price", vd.x, vd.y + 5);
      addTooltip(vd.x, vd.y, `Demand at max price: Q ≈ ${Qd_c.toFixed(2)}`);
    }
    if (Qs_c >= 0 && Qs_c <= Qmax) {
      let vs = econToScreen(Qs_c, Pc);
      fill(255, 80, 80);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Supply at max price", vs.x, vs.y + 5);
      addTooltip(vs.x, vs.y, `Supply at max price: Q ≈ ${Qs_c.toFixed(2)}`);
    }

    if (Pc < eq.Pe) {
      let shortage = Qd_c - Qs_c;
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        `Max price is below the balance price → shortage ≈ ${shortage.toFixed(
          2
        )} units`,
        margin + 10,
        margin + 10
      );

      let leftQ = max(0, min(Qd_c, Qs_c));
      let rightQ = min(Qmax, max(Qd_c, Qs_c));
      let p1 = econToScreen(leftQ, Pc);
      let p2 = econToScreen(rightQ, Pc);
      let p3 = econToScreen(rightQ, Pc - 0.4);
      let p4 = econToScreen(leftQ, Pc - 0.4);
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
        margin + 10,
        margin + 10
      );
    }
  }

  // Floor
  if (floorCheckbox.checked()) {
    let Pf = floorSlider.value();
    let v1 = econToScreen(0, Pf);
    let v2 = econToScreen(Qmax, Pf);
    stroke(200, 120, 0);
    strokeWeight(1.5);
    line(v1.x, v1.y, v2.x, v2.y);

    noStroke();
    fill(darkMode ? 255 : 0);
    text(`Min price = ${Pf.toFixed(2)}`, v2.x - 140, v2.y + 3);

    let Qd_f = (aBase - Pf) / b;
    let Qs_f = (Pf - cPolicy) / d;

    if (Qd_f >= 0 && Qd_f <= Qmax) {
      let vd = econToScreen(Qd_f, Pf);
      fill(80, 150, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Demand at min price", vd.x, vd.y + 5);
      addTooltip(vd.x, vd.y, `Demand at min price: Q ≈ ${Qd_f.toFixed(2)}`);
    }
    if (Qs_f >= 0 && Qs_f <= Qmax) {
      let vs = econToScreen(Qs_f, Pf);
      fill(255, 80, 80);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Supply at min price", vs.x, vs.y + 5);
      addTooltip(vs.x, vs.y, `Supply at min price: Q ≈ ${Qs_f.toFixed(2)}`);
    }

    if (Pf > eq.Pe) {
      let surplus = Qs_f - Qd_f;
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        `Min price is above the balance price → surplus ≈ ${surplus.toFixed(
          2
        )} units`,
        margin + 10,
        margin + 30
      );

      let leftQ = max(0, min(Qd_f, Qs_f));
      let rightQ = min(Qmax, max(Qd_f, Qs_f));
      let p1 = econToScreen(leftQ, Pf);
      let p2 = econToScreen(rightQ, Pf);
      let p3 = econToScreen(rightQ, Pf + 0.4);
      let p4 = econToScreen(leftQ, Pf + 0.4);
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
        margin + 10,
        margin + 30
      );
    }
  }
}

// --------------- TAX AND SUBSIDY WEDGE -----------------

function drawTaxSubsidyWedge(aBase, b, cBase, cPolicy, d, eq, tax, subsidy) {
  if (!eq) return;
  if (tax <= 0 && subsidy <= 0) return;

  let Qe = eq.Qe;
  let Pd = demandPrice(Qe, aBase, b);
  let Pp = supplyPrice(Qe, cBase, d);

  let vPd = econToScreen(Qe, Pd);
  let vPp = econToScreen(Qe, Pp);

  stroke(120, 0, 200);
  strokeWeight(2);
  line(vPd.x, vPd.y, vPp.x, vPp.y);

  noStroke();
  fill(120, 0, 200, 80);
  let band = 0.3;
  let vPd2 = econToScreen(Qe + band, Pd);
  let vPp2 = econToScreen(Qe + band, Pp);
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
  noStroke();
  textAlign(LEFT, BOTTOM);
  text(label, vPd.x + 10, (vPd.y + vPp.y) / 2);

  addTooltip(
    (vPd.x + vPp.x) / 2,
    (vPd.y + vPp.y) / 2,
    `${label}\nBuyer price ≈ ${Pd.toFixed(2)}, seller price ≈ ${Pp.toFixed(2)}`
  );
}

// --------------- INFO PANEL (SIMPLE AND PRO) -----------------

function drawParameterText(
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
  let x0 = width - 360;
  let y = margin;

  const mode = modeSelect ? modeSelect.value() : "kids";

  fill(darkMode ? 255 : 0);
  textSize(13);
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
}

// --------------- TOOLTIP SYSTEM -----------------

function addTooltip(x, y, label) {
  tooltipItems.push({ x, y, label });
}

function drawTooltip() {
  let closest = null;
  let minDist = 18;
  for (let item of tooltipItems) {
    let d = dist(mouseX, mouseY, item.x, item.y);
    if (d < minDist) {
      minDist = d;
      closest = item;
    }
  }
  if (!closest) return;

  textSize(12);
  let lines = closest.label.split("\n");
  let w = 0;
  for (let line of lines) w = max(w, textWidth(line));
  let h = lines.length * 16 + 6;

  let bx = closest.x + 12;
  let by = closest.y - h - 10;
  bx = constrain(bx, margin, width - margin - w - 10);
  by = constrain(by, margin, height - margin - h - 10);

  fill(darkMode ? 40 : 245);
  stroke(darkMode ? 220 : 0);
  rect(bx, by, w + 10, h, 5);

  noStroke();
  fill(darkMode ? 255 : 0);
  let ty = by + 14;
  for (let line of lines) {
    text(line, bx + 5, ty);
    ty += 16;
  }
}

// --------------- WATERMARK POSITIONING -----------------

function positionWatermark() {
  if (!watermarkDiv) return;

  // Stick to the very bottom-right of the window with a small margin
  watermarkDiv.position(windowWidth - 20 - watermarkDiv.elt.offsetWidth, windowHeight - 24);
  watermarkDiv.style("opacity", "0.65");
}

// --------------- SCENARIOS AND RESET -----------------

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
  floorSlider.value(5);
  taxSlider.value(2);
  subsidySlider.value(2);

  animateCheckbox.checked(false);
}

function applyScenario() {
  const s = scenarioSelect.value();
  resetDefaults();

  if (s === "baseline") {
    // Normal market
  } else if (s === "demand_boom") {
    demandShiftSlider.value(4);
  } else if (s === "supply_shock") {
    supplyShiftSlider.value(4);
  } else if (s === "ceiling") {
    ceilingCheckbox.checked(true);
    ceilingSlider.value(10);
  } else if (s === "floor") {
    floorCheckbox.checked(true);
    floorSlider.value(10);
  } else if (s === "tax") {
    taxCheckbox.checked(true);
    taxSlider.value(3);
  } else if (s === "subsidy") {
    subsidyCheckbox.checked(true);
    subsidySlider.value(3);
  }

  scenarioSelect.value(s);
}

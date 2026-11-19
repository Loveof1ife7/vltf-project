(() => {
  const scenes = window.vltfScenes;
  const sceneTabs = document.getElementById('scene-tabs');
  const sceneNote = document.getElementById('scene-note');
  const intentChoices = document.getElementById('intent-choices');
  const caseImage = document.getElementById('case-image');
  const casePrompt = document.getElementById('case-prompt');
  const resultLabel = document.getElementById('result-label');
  const resultDot = document.querySelector('.result-preview .sample-dot');
  const tfPanel = document.getElementById('tf-panel');
  const overlay = document.getElementById('overlay-curves');
  const chart = document.getElementById('tf-chart');
  const context = chart.getContext('2d');

  let activeScene = scenes[0];
  let selectedIntent = 0;
  let sceneButtons = [];
  let intentButtons = [];
  const curveColors = ['#146050', '#a74f33', '#645190'];

  function button(label, onClick) {
    const control = document.createElement('button');
    control.type = 'button';
    control.textContent = label;
    control.addEventListener('click', onClick);
    return control;
  }

  function setPressed(buttons, index) {
    buttons.forEach((control, i) => {
      control.setAttribute('aria-pressed', String(i === index));
    });
  }

  function showScene(index) {
    activeScene = scenes[index];
    setPressed(sceneButtons, index);
    sceneNote.textContent = activeScene.subtitle;
    resultDot.className = 'sample-dot ' + activeScene.id + '-dot';
    intentButtons = activeScene.cases.map((item, i) => {
      const control = button(item.label, () => showIntent(i));
      control.style.setProperty('--curve-color', curveColors[i]);
      return control;
    });
    intentChoices.replaceChildren(...intentButtons);
    showIntent(0);
  }

  function showIntent(index) {
    selectedIntent = index;
    const item = activeScene.cases[index];
    setPressed(intentButtons, index);
    caseImage.src = item.image;
    caseImage.alt = item.alt;
    casePrompt.textContent = item.prompt;
    resultLabel.textContent = item.label;
    drawChart();
  }

  function drawChart() {
    if (!context) return;
    const width = chart.clientWidth;
    const height = chart.clientHeight;
    if (!width || !height) return;

    const density = window.devicePixelRatio || 1;
    chart.width = Math.round(width * density);
    chart.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);

    const bounds = { left: 39, top: 12, right: width - 14, bottom: height - 43 };
    const values = activeScene.cases[selectedIntent].values;
    const peak = values.reduce((highest, point) => point[1] > highest[1] ? point : highest);
    const highestOpacity = Math.max(...activeScene.cases.flatMap(item => item.values.map(point => point[1])));
    const steps = Math.max(1, Math.ceil(highestOpacity / activeScene.step));
    const maximum = steps * activeScene.step;
    const x = value => bounds.left + value * (bounds.right - bounds.left);
    const y = value => bounds.bottom - (value / maximum) * (bounds.bottom - bounds.top);

    context.font = '12px system-ui, sans-serif';
    context.fillStyle = '#435954';
    context.strokeStyle = '#dce8e1';
    context.lineWidth = 1;
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    for (let i = 0; i <= steps; i += 1) {
      const tick = i * activeScene.step;
      const level = y(tick);
      context.beginPath();
      context.moveTo(bounds.left, level);
      context.lineTo(bounds.right, level);
      context.stroke();
      context.fillText(i === 0 ? '0' : tick.toFixed(1), bounds.left - 7, level);
    }

    context.strokeStyle = '#8ca59a';
    context.beginPath();
    context.moveTo(bounds.left, bounds.top);
    context.lineTo(bounds.left, bounds.bottom);
    context.lineTo(bounds.right, bounds.bottom);
    context.stroke();

    context.textAlign = 'center';
    context.textBaseline = 'top';
    for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
      context.fillText(String(tick), x(tick), bounds.bottom + 7);
    }
    context.fillText('Normalized scalar value', (bounds.left + bounds.right) / 2, height - 15);

    if (overlay.checked) {
      activeScene.cases.forEach((item, index) => {
        if (index !== selectedIntent) {
          drawCurve(item.values, curveColors[index], [4, 4], 1.5, 0.68);
        }
      });
    }
    const selectedColor = overlay.checked ? curveColors[selectedIntent] : curveColors[0];
    drawCurve(values, selectedColor, [], 2.5, 1);

    chart.setAttribute('aria-label', [
      'Opacity plotted against normalized scalar value.',
      activeScene.cases[selectedIntent].label + '.',
      'Peak opacity approximately ' + peak[1].toFixed(3) + ' at scalar ' + peak[0].toFixed(2) + '.',
      overlay.checked ? 'Other intents for this volume are overlaid as dashed curves.' : '',
    ].filter(Boolean).join(' '));

    function drawCurve(points, color, dash, lineWidth, alpha) {
      context.save();
      context.strokeStyle = color;
      context.globalAlpha = alpha;
      context.lineWidth = lineWidth;
      context.lineJoin = 'round';
      context.setLineDash(dash);
      context.beginPath();
      context.moveTo(x(points[0][0]), y(points[0][1]));
      for (const [scalar, opacity] of points.slice(1)) {
        context.lineTo(x(scalar), y(opacity));
      }
      context.stroke();
      context.restore();
    }
  }

  sceneButtons = scenes.map((scene, index) => button(scene.name, () => showScene(index)));
  sceneTabs.append(...sceneButtons);
  sceneTabs.hidden = false;
  intentChoices.hidden = false;
  tfPanel.hidden = !context;
  if (context) {
    overlay.addEventListener('change', () => {
      intentChoices.classList.toggle('has-curve-key', overlay.checked);
      drawChart();
    });
    const observer = new ResizeObserver(drawChart);
    observer.observe(chart);
  }
  showScene(0);
})();

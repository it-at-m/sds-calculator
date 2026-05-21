// Interaktion fuer die hellblaue statische SDS-Seite: Klicks auf Ja/Nein summieren und Score anzeigen
(function () {
  const rows = Array.from(document.querySelectorAll('.checklist .row'));
  const scoreEl = document.getElementById('scoreNumber');
  const softwareNameEl = document.getElementById('softwareName');
  const copyLinkBtn = document.getElementById('copyLink');
  const paramByQuestion = {
    0: 'alt',
    1: 'head',
    2: 'os',
    3: 'sup',
    4: 'api',
    5: 'dat'
  };

  function currentUrl() {
    return new URL(window.location.href);
  }

  function syncUrl() {
    const url = currentUrl();

    for (const row of rows) {
      const param = paramByQuestion[row.dataset.q];
      if (!param) continue;

      const selected = state.get(row);
      if (selected === 'yes') {
        url.searchParams.set(param, 'y');
      } else if (selected === 'no') {
        url.searchParams.set(param, 'n');
      } else {
        url.searchParams.delete(param);
      }
    }

    const name = softwareNameEl ? softwareNameEl.value.trim() : '';
    if (name) {
      url.searchParams.set('name', name);
    } else {
      url.searchParams.delete('name');
    }

    window.history.replaceState({}, '', url);
  }

  function applyUrlParams() {
    const url = currentUrl();

    if (softwareNameEl) {
      softwareNameEl.value = url.searchParams.get('name') || '';
    }

    for (const row of rows) {
      const param = paramByQuestion[row.dataset.q];
      if (!param) continue;

      const value = url.searchParams.get(param);
      const target = value === 'y'
        ? row.querySelector('.value.yes')
        : value === 'n'
          ? row.querySelector('.value.no')
          : null;

      if (!target) continue;

      const yes = row.querySelector('.value.yes');
      const no = row.querySelector('.value.no');
      yes.classList.remove('selected');
      no.classList.remove('selected');
      yes.setAttribute('aria-pressed', 'false');
      no.setAttribute('aria-pressed', 'false');

      target.classList.add('selected');
      target.setAttribute('aria-pressed', 'true');
      state.set(row, value === 'y' ? 'yes' : 'no');
    }
  }

  async function copyCurrentLink() {
    syncUrl();

    const btn = copyLinkBtn;
    if (!btn) return;

    const originalText = btn.textContent;
    const link = window.location.href;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const fallback = document.createElement('textarea');
        fallback.value = link;
        fallback.setAttribute('readonly', '');
        fallback.style.position = 'fixed';
        fallback.style.left = '-9999px';
        document.body.appendChild(fallback);
        fallback.select();
        document.execCommand('copy');
        document.body.removeChild(fallback);
      }

      btn.textContent = 'Kopiert';
      btn.disabled = true;

      window.setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 1500);
    } catch (err) {
      btn.textContent = 'Nicht kopiert';
      window.setTimeout(() => {
        btn.textContent = originalText;
      }, 1500);
    }
  }


  // Zustand pro Zeile: 'yes' | 'no' | null
  const state = new Map();

  function calcScore() {
    // Sonderlogik: Frage 0 entscheidet, ob berechnet wird oder direkt 5 gesetzt wird.
    const row0 = document.querySelector('.checklist .row[data-q="0"]');
    const yes0 = row0 ? row0.querySelector('.value.yes') : null;
    const no0 = row0 ? row0.querySelector('.value.no') : null;
    const connector = document.getElementById('connector');

    const isNoSelected = !!no0 && no0.classList.contains('selected');
    const isYesSelected = !!yes0 && yes0.classList.contains('selected');

    if (connector) {
      // Pfeil nur anzeigen, wenn Frage 0 mit "Nein" beantwortet ist
      connector.style.display = isNoSelected ? 'block' : 'none';
      if (isNoSelected) {
        // bei Einblendung neu positionieren
        drawConnector();
      }
    }

    if (isNoSelected) {
      // Keine weitere Berechnung: fester SDS 5
      scoreEl.textContent = '5';
      return;
    }

    // Berechnung nur wenn Frage 0 mit Ja beantwortet (oder noch nicht beantwortet)
    let sum = 0;
    for (const row of rows) {
      const sel = row.querySelector('.value.selected');
      if (!sel) continue;
      const v = Number(sel.getAttribute('data-value'));
      if (isFinite(v)) sum += v;
    }
    const display = (sum === 0) ? 1 : sum; // 0 -> 1
    scoreEl.textContent = String(display);
  }

  function select(row, target) {
    const yes = row.querySelector('.value.yes');
    const no = row.querySelector('.value.no');
    yes.classList.remove('selected');
    no.classList.remove('selected');
    yes.setAttribute('aria-pressed', 'false');
    no.setAttribute('aria-pressed', 'false');
    if (target === yes) {
      yes.classList.add('selected');
      yes.setAttribute('aria-pressed', 'true');
      state.set(row, 'yes');
    } else if (target === no) {
      no.classList.add('selected');
      no.setAttribute('aria-pressed', 'true');
      state.set(row, 'no');
    } else {
      state.set(row, null);
    }
    calcScore();
    syncUrl();
  }

  applyUrlParams();

  // Initial: URL-Parameter anwenden und Score berechnen
  calcScore();
  drawQ0LineAndArrow();

  if (softwareNameEl) {
    softwareNameEl.addEventListener('input', syncUrl);
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', copyCurrentLink);
  }

  // Verbindungspfeil vom "Nein" der Zeile 0 zur Score-Box zeichnen
  function drawConnector() {
    const svg = document.getElementById('connector');
    const path = document.getElementById('connectorPath');
    const head = document.getElementById('connectorHead');
    const row0 = document.querySelector('.checklist .row[data-q="0"] .value.no');
    const box = document.querySelector('.score-box');
    if (!svg || !path || !head || !row0 || !box) return;
    const a = row0.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const root = document.querySelector('.sheet').getBoundingClientRect();

    // Koordinaten relativ zum Sheet (SVG-Bereich)
    // Startpunkt: etwas weiter rechts neben der rechten Kante des "Nein"-Feldes (laengerer Startstrich)
    const startOffset = 16; // zuvor 6
    const x1 = a.right - root.left + startOffset;
    const y1 = a.top + a.height/2 - root.top;
    const yScore = b.top + b.height/2 - root.top;
    const sheetWidth = root.width;
    const railPad = 8; // vertikale Schiene naeher an die rechte Kante schieben (zuvor 24)
    const xr = sheetWidth - railPad;

    // Zielanflug: knapp rechts der Score-Box enden, ohne nach rechts auszufedern
    const stopPad = 12; // Abstand rechts von der Score-Box
    const desiredStop = (b.right - root.left) + stopPad;
    const stopRight = Math.min(desiredStop, xr - 6); // nicht weiter rechts als die Schiene - 6px

    // Orthogonaler Pfad: rechts raus, senkrecht runter an der Schiene, dann nach LINKS bis zum Endpunkt vor der Score-Box
    const d = `M ${x1} ${y1} L ${xr} ${y1} L ${xr} ${yScore} L ${stopRight} ${yScore}`;
    path.setAttribute('d', d);

    // Pfeilkopf als Polygon (seitlich zeigend nach links): Form wie im Beispiel, skaliert und an Endpunkt ausgerichtet
    const endX = stopRight - 2;
    const endY = yScore;
    const size = 6; // Kopf-Groesse
    const len = size * 1.5;      // Laenge des Kopfes (von Spitze nach rechts)
    const halfH = size;        // halbe Hohe des Kopfes
    // Dreieckiger Kopf, nach links zeigend: Spitze am Endpunkt, Basis rechts
    const p = [
      [endX, endY],
      [endX + len, endY - halfH],
      [endX + len, endY + halfH],
    ];
    const pointsAttr = p.map(([x,y]) => `${x},${y}`).join(' ');
    head.setAttribute('points', pointsAttr);
  }

  // Linie/Pfeil unter Frage 0 vorbereiten
  function drawQ0LineAndArrow() {
    const row0 = document.querySelector('.checklist .row[data-q="0"]');
    const yes0 = row0 ? row0.querySelector('.value.yes') : null;
    const overlay = document.getElementById('q0overlay');
    const lineFull = document.getElementById('q0LineFull');
    const lineLeft = document.getElementById('q0LineLeft');
    const lineRight = document.getElementById('q0LineRight');
    const arrow = document.getElementById('q0Arrow');
    if (!row0 || !yes0 || !overlay || !lineFull || !lineLeft || !lineRight || !arrow) return;

    // Geometrie bestimmen
    const root = document.querySelector('.sheet').getBoundingClientRect();
    const r0 = row0.getBoundingClientRect();
    const yBox = yes0.getBoundingClientRect();

    const y = r0.bottom - root.top + 12; // mehr Abstand: Linie 12px unter Zeile 0
    const xStart = r0.left - root.left + 40; // nach Index-Kreis
    const xEnd = r0.right - root.left; // bis zum rechten Rand der Zeile

    // Standard: durchgehende Linie
    lineFull.setAttribute('d', `M ${xStart} ${y} L ${xEnd} ${y}`);
    lineFull.style.display = 'block';
    lineLeft.style.display = 'none';
    lineRight.style.display = 'none';
    arrow.style.display = 'none';

    // Wenn Ja bei 0 ausgewählt: Linie unterbrechen und kleine Pfeilspitze unter die Ja-Box
    const isYes = yes0.classList.contains('selected');
    if (isYes) {
      const gapHalf = 8; // Luecke um die Pfeilspitze herum
      const cx = yBox.left + yBox.width/2 - root.left;
      // Links- und Rechtssegmente setzen
      lineLeft.setAttribute('d', `M ${xStart} ${y} L ${cx - gapHalf} ${y}`);
      lineRight.setAttribute('d', `M ${cx + gapHalf} ${y} L ${xEnd} ${y}`);
      lineFull.style.display = 'none';
      lineLeft.style.display = 'block';
      lineRight.style.display = 'block';
      // Pfeilspitze (kleines nach unten zeigendes Dreieck)
      const size = 5;
      const points = [
        [cx, y + 2],
        [cx - size, y - size],
        [cx + size, y - size],
      ].map(([x, yy]) => `${x},${yy}`).join(' ');
      arrow.setAttribute('points', points);
      arrow.style.display = 'block';
    }
  }

  window.addEventListener('resize', drawConnector);
  window.addEventListener('load', drawConnector);
  // Nach Mount einmal zeichnen
  drawConnector();

  // Events fuer Linie/Pfeil unter Frage 0
  window.addEventListener('resize', drawQ0LineAndArrow);
  window.addEventListener('load', drawQ0LineAndArrow);
  drawQ0LineAndArrow();

  for (const row of rows) {
    row.addEventListener('click', (e) => {
      const el = (e.target instanceof Element) ? e.target : null;
      const target = el ? el.closest('button.value') : null;
      if (!target || !row.contains(target)) return;
      select(row, target);
      // Linie/Pfeil bei Frage 0 ggf. aktualisieren
      if (row.dataset.q === '0') drawQ0LineAndArrow();
    });
    // Buttons reagieren bereits auf Enter/Space; keine doppelte Keydown-Logik noetig
  }
})();

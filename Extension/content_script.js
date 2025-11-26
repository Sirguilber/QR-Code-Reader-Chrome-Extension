// content_script.js
// Inyecta un boton flotante y el panel con funciones random.

(function() {
  if (window.__mi_ext_random_inyectado) return;
  window.__mi_ext_random_inyectado = true;

  // Estilos basicos del boton y panel
  const css = `
  .mer_btn_random {
    position: fixed;
    right: 16px;
    bottom: 16px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg,#4b75ff,#6ee7b7);
    border-radius: 50%;
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:2147483647;
    cursor:pointer;
  }
  .mer_panel {
    position: fixed;
    right: 16px;
    bottom: 86px;
    width: 360px;
    max-height: 60vh;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    z-index:2147483647;
    overflow:auto;
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
  }
  .mer_panel header{
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:10px 12px;
    border-bottom:1px solid #eee;
    background: linear-gradient(90deg,#f5f7ff,#ffffff);
  }
  .mer_panel .content{ padding:12px; font-size:14px; line-height:1.4; }
  .mer_controls{ display:flex; gap:8px; padding:8px 12px; border-top:1px solid #eee; background:#fbfbff; }
  .mer_controls button{ padding:6px 8px; border-radius:6px; border:1px solid #ddd; background:#fff; cursor:pointer; }
  .mer_highlight{ background: #fff3b0; transition: background 0.3s; }
  `;

  const style = document.createElement('style');
  style.id = 'mer_style';
  style.textContent = css;
  document.documentElement.appendChild(style);

  // Boton flotante
  const btn = document.createElement('div');
  btn.className = 'mer_btn_random';
  btn.title = 'Mi Extension Random';
  btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8H9L12 2Z" fill="white"/><circle cx="12" cy="15" r="6" fill="white"/></svg>';
  document.body.appendChild(btn);

  // Panel (inicialmente oculto)
  const panel = document.createElement('div');
  panel.className = 'mer_panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <header>
      <strong>Random Helper</strong>
      <button id="mer_close" style="border:none;background:none;cursor:pointer;font-size:16px">✕</button>
    </header>
    <div class="content" id="mer_content">
      <p id="mer_status">Presiona "Generar resumen" para analizar esta pagina.</p>
    </div>
    <div class="mer_controls">
      <button id="mer_summarize">Generar resumen</button>
      <button id="mer_copy">Copiar</button>
      <button id="mer_speak">Leer</button>
      <button id="mer_highlight">Resaltar</button>
      <button id="mer_joke">Chiste</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Eventos UI
  btn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });
  panel.querySelector('#mer_close').addEventListener('click', () => panel.style.display = 'none');

  // Utils: extraer texto visible
  function getVisibleText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const style = window.getComputedStyle(parent);
        if (style && (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('header, nav, footer, script, style, noscript')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }, false);

    let text = '';
    let node;
    while (node = walker.nextNode()) {
      text += node.nodeValue + ' ';
    }
    return text.replace(/\s+/g,' ').trim();
  }

  // Resumen basico (heuristico)
  function summarizeText(text, maxSentences = 4) {
    if (!text) return '';
    // separar en oraciones
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    if (sentences.length <= maxSentences) return sentences.join(' ').trim();

    // puntuacion por frecuencia de palabras
    const freq = {};
    const words = text.toLowerCase().match(/\b[ a-z0-9]{2,}\b/g) || [];
    words.forEach(w => { freq[w] = (freq[w]||0) + 1; });

    const score = sentences.map(s => {
      const ws = s.toLowerCase().match(/\b[ a-z0-9]{2,}\b/g) || [];
      let sc = 0;
      ws.forEach(w => { sc += (freq[w]||0); });
      sc = sc / Math.sqrt(ws.length + 1);
      // preferir oraciones cortas-medium
      sc *= (1 + Math.max(0, 1 - Math.abs(ws.length - 20)/40));
      return { s, sc };
    });

    score.sort((a,b) => b.sc - a.sc);
    const chosen = score.slice(0, maxSentences).sort((a,b) => text.indexOf(a.s) - text.indexOf(b.s)).map(x => x.s.trim());
    return chosen.join(' ');
  }

  // Destacar parrafos principales
  let highlighted = [];
  function toggleHighlight() {
    if (highlighted.length) {
      highlighted.forEach(el => el.classList.remove('mer_highlight'));
      highlighted = [];
      return;
    }
    // elegir parrafos con mayor texto
    const paras = Array.from(document.querySelectorAll('p, h1, h2, h3, li'));
    paras.sort((a,b)=> b.innerText.length - a.innerText.length);
    const top = paras.slice(0,5);
    top.forEach(el => el.classList.add('mer_highlight'));
    highlighted = top;
  }

  // Copiar al portapapeles
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch(e) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(ta);
      return false;
    }
  }

  // Chistes internos
  const jokes = [
    "¿Por que el libro de matematicas estaba triste? Tenia muchos problemas.",
    "¿Que hace una abeja en el gimnasio? ¡Zum-ba!",
    "¿Cual es la fruta mas paciente? La aguacate, porque siempre espera a madurar."
  ];

  // Bind de botones
  panel.querySelector('#mer_summarize').addEventListener('click', () => {
    const status = panel.querySelector('#mer_status');
    status.textContent = 'Analizando...';
    setTimeout(() => {
      const raw = getVisibleText();
      const summary = summarizeText(raw, 4) || 'No se encontro texto visible en la pagina.';
      panel.querySelector('#mer_content').innerHTML = `<p id="mer_status">${escapeHtml(summary)}</p>`;
    }, 150); // small delay para UI
  });

  panel.querySelector('#mer_copy').addEventListener('click', async () => {
    const txt = panel.querySelector('#mer_status')?.innerText || '';
    if (!txt) return;
    await copyToClipboard(txt);
    panel.querySelector('#mer_status').innerText = 'Resumen copiado al portapapeles.';
    setTimeout(()=> {
      // restaurar resumen (vuelve a generar rapido si es necesario)
      panel.querySelector('#mer_status').innerText = txt;
    }, 900);
  });

  panel.querySelector('#mer_speak').addEventListener('click', () => {
    const txt = panel.querySelector('#mer_status')?.innerText || '';
    if (!txt) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      // elegir un voz disponible preferente
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) {
        // preferir voces en espanol si existen
        const v = voices.find(x=>/es|spanish/i.test(x.lang)) || voices[0];
        u.voice = v;
      }
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } else {
      panel.querySelector('#mer_status').innerText = 'Speech API no disponible en este navegador.';
    }
  });

  panel.querySelector('#mer_highlight').addEventListener('click', () => {
    toggleHighlight();
  });

  panel.querySelector('#mer_joke').addEventListener('click', () => {
    const j = jokes[Math.floor(Math.random()*jokes.length)];
    panel.querySelector('#mer_status').innerText = j;
  });

  // utilidad escapar html
  function escapeHtml(s){
    return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }

  // Cerrar panel si se cambia de pagina (navegacion SPA puede reinyectar)
  window.addEventListener('beforeunload', () => {
    try { panel.remove(); btn.remove(); style.remove(); } catch(e){}
  });

})();

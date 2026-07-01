/* ---------- NAVIGATION ---------- */
  function goPage(id){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+(id==='home'?'home':id)).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    const btn = document.querySelector('.nav-btn[data-page="'+id+'"]');
    if(btn) btn.classList.add('active');
    document.querySelectorAll('.nav-item.open').forEach(i=>i.classList.remove('open'));
    document.getElementById('menu').classList.remove('open');
    window.scrollTo({top:0, behavior:'smooth'});
  }
 
  function toggleDropdown(itemId){
    const item = document.getElementById(itemId);
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('open'));
    if(!isOpen) item.classList.add('open');
  }
 
  document.addEventListener('click', function(e){
    if(!e.target.closest('.nav-item')){
      document.querySelectorAll('.nav-item.open').forEach(i=>i.classList.remove('open'));
    }
  });
 
  document.getElementById('hamburger').addEventListener('click', function(){
    document.getElementById('menu').classList.toggle('open');
  });
 
  function openTeori(key){
    goPage('modul');
    document.querySelectorAll('.teori-panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.teori-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('t-'+key).classList.add('active');
    document.querySelector('.teori-btn[data-t="'+key+'"]').classList.add('active');
  }
 
  /* ---------- MAP MODAL ---------- */
  const mapTitles = {
    bulatan: '🧩 Peta Bulatan — Brainstorming',
    pokok:   '🌳 Peta Pokok — Mengorganisasi',
    alir:    '🔀 Peta Alir — Membuat Keputusan',
    dakap:   '🔗 Peta Dakap — Menghubung Idea'
  };
  let currentMap = null;

  function openTool(key){
    currentMap = key;
    document.getElementById('mapTitle').textContent = mapTitles[key];
    document.querySelectorAll('.map-view').forEach(v=>v.classList.remove('active'));
    document.getElementById('mv-'+key).classList.add('active');
    document.getElementById('mapOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    if(key === 'bulatan') initBulatan();
    if(key === 'dakap') resizeDakapBrace();
  }

  function closeMap(){
    document.getElementById('mapOverlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('mapOverlay').addEventListener('click', function(e){
    if(e.target === this) closeMap();
  });

  /* ---------------------------------------------------------
     Peta Bulatan — Topik statik di tengah, idea boleh diseret
     tetapi terkurung dalam gelang (inner ring -> outer boundary).
     Ini "controlled movement": bukan free canvas, sebab jarak
     dari tengah sentiasa dikekang antara minR dan maxR.
     --------------------------------------------------------- */
  let bulatanNodeCount = 4;
  let bulatanInited = false;

  /* Circular/oval boxes (topic + idea nodes) can't use a manual drag-resize
     corner without looking broken — instead they auto-grow to fit long text,
     capped at a max size ("boleh besar, tapi still ada limit"). Short text
     keeps the original round shape; long text switches to a pill shape. */
  const BULATAN_TOPIC_SIZE = { defaultW: 130, defaultH: 80, maxW: 190, maxH: 150 };
  const BULATAN_IDEA_SIZE  = { defaultW: 120, defaultH: 58, maxW: 190, maxH: 130 };

  function autoFitBulatanBox(ta, size){
    ta.style.height = 'auto';
    const needed = ta.scrollHeight;
    if(needed > size.defaultH || ta.value.length > 18){
      ta.style.height = Math.min(size.maxH, Math.max(size.defaultH, needed + 4)) + 'px';
      ta.style.width = Math.min(size.maxW, size.defaultW + Math.ceil(ta.value.length / 2) * 3) + 'px';
      ta.style.borderRadius = '18px';
    } else {
      ta.style.height = size.defaultH + 'px';
      ta.style.width = size.defaultW + 'px';
      ta.style.borderRadius = '50%';
    }
  }

  function bindBulatanAutoFit(ta, size){
    const fit = () => autoFitBulatanBox(ta, size);
    ta.addEventListener('input', fit);
    fit();
  }

  function initBulatan(){
    const outer = document.getElementById('bulatan-outer');
    if(!outer) return;
    const nodes = outer.querySelectorAll('.idea-node');
    if(!bulatanInited){
      const total = nodes.length || 1;
      nodes.forEach((el, i)=>{
        const angle = (360 / total) * i - 90;
        el.dataset.angle = angle;
        el.dataset.ratio = 0.68;
        makeBulatanDraggable(el);
        const ta = el.querySelector('textarea.map-input');
        if(ta) bindBulatanAutoFit(ta, BULATAN_IDEA_SIZE);
      });
      const topicTa = document.getElementById('bulatan-topic');
      if(topicTa) bindBulatanAutoFit(topicTa, BULATAN_TOPIC_SIZE);
      bulatanInited = true;
    }
    relayoutBulatan();
  }

  function getBulatanRadii(outer){
    const R = outer.clientWidth / 2;
    const nodeHalf = 75;   // buffer for idea boxes that can auto-grow when text is long
    const innerR = 100;    // radius of the reserved zone around the static center topic (which can also grow)
    const maxR = Math.max(R - nodeHalf - 6, innerR + 20);
    const minR = innerR + 4;
    return { R, maxR, minR };
  }

  function positionBulatanNode(el, angleDeg, ratio){
    const outer = document.getElementById('bulatan-outer');
    if(!outer) return;
    const { maxR, minR } = getBulatanRadii(outer);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const r = minR + (maxR - minR) * clampedRatio;
    const rad = angleDeg * Math.PI / 180;
    const cx = outer.clientWidth / 2;
    const cy = outer.clientHeight / 2;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  function relayoutBulatan(){
    const outer = document.getElementById('bulatan-outer');
    if(!outer) return;
    outer.querySelectorAll('.idea-node').forEach(el=>{
      const angle = parseFloat(el.dataset.angle || 0);
      const ratio = parseFloat(el.dataset.ratio != null ? el.dataset.ratio : 0.68);
      positionBulatanNode(el, angle, ratio);
    });
  }

  function makeBulatanDraggable(el){
    const handle = el.querySelector('.node-handle');
    if(!handle) return;
    handle.addEventListener('pointerdown', function(e){
      e.preventDefault();
      const outer = document.getElementById('bulatan-outer');
      if(!outer) return;
      el.classList.add('dragging');
      try{ handle.setPointerCapture(e.pointerId); }catch(err){}

      function onMove(ev){
        const rect = outer.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const px = ev.clientX - rect.left, py = ev.clientY - rect.top;
        let dx = px - cx, dy = py - cy;
        let dist = Math.sqrt(dx * dx + dy * dy);
        const { maxR, minR } = getBulatanRadii(outer);
        dist = Math.max(minR, Math.min(maxR, dist));
        const angle = Math.atan2(dy, dx);
        const x = cx + dist * Math.cos(angle);
        const y = cy + dist * Math.sin(angle);
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.dataset.angle = angle * 180 / Math.PI;
        el.dataset.ratio = (dist - minR) / (maxR - minR || 1);
      }
      function onUp(ev){
        try{ handle.releasePointerCapture(ev.pointerId); }catch(err){}
        el.classList.remove('dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  function addBulatan(){
    bulatanNodeCount++;
    const outer = document.getElementById('bulatan-outer');
    const d = document.createElement('div');
    d.className = 'idea-node';
    d.innerHTML = `<div class="node-handle drag-handle" title="Seret idea">⠿</div>
      <textarea class="map-input" placeholder="Idea ${bulatanNodeCount}"></textarea>
      <button class="del-btn" onclick="this.closest('.idea-node').remove()">×</button>`;
    outer.appendChild(d);
    const angle = Math.random() * 360;
    d.dataset.angle = angle;
    d.dataset.ratio = 0.4 + Math.random() * 0.5;
    positionBulatanNode(d, angle, d.dataset.ratio);
    makeBulatanDraggable(d);
    const ta = d.querySelector('textarea.map-input');
    if(ta) bindBulatanAutoFit(ta, BULATAN_IDEA_SIZE);
  }

  window.addEventListener('resize', function(){
    if(bulatanInited) relayoutBulatan();
  });

  /* ---------------------------------------------------------
     Generic controlled drag-to-reorder helper.
     Used by Peta Pokok (kategori + sub-item), Peta Alir (langkah)
     and Peta Dakap (bahagian). It only ever changes ORDER inside
     one fixed container — never moves an item to a different
     parent — so structure stays intact ("controlled movement").
     --------------------------------------------------------- */
  function enableDragReorder(item, container, axis, onReorder){
    const handle = item.querySelector(':scope > .drag-handle');
    if(!handle) return;
    handle.addEventListener('pointerdown', function(e){
      e.preventDefault();
      item.classList.add('dragging-item');
      try{ handle.setPointerCapture(e.pointerId); }catch(err){}

      function onMove(ev){
        const siblings = Array.from(container.children).filter(c => c !== item);
        let target = null, insertBefore = true;
        for(const sib of siblings){
          const r = sib.getBoundingClientRect();
          const center = axis === 'x' ? (r.left + r.width / 2) : (r.top + r.height / 2);
          const pos = axis === 'x' ? ev.clientX : ev.clientY;
          if(pos < center){ target = sib; insertBefore = true; break; }
          target = sib; insertBefore = false;
        }
        if(target){
          if(insertBefore) container.insertBefore(item, target);
          else container.insertBefore(item, target.nextSibling);
        }
        if(onReorder) onReorder();
      }
      function onUp(ev){
        try{ handle.releasePointerCapture(ev.pointerId); }catch(err){}
        item.classList.remove('dragging-item');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if(onReorder) onReorder();
      }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  /* Peta Pokok */
  function initPokokBranchDrag(branchEl){
    const branches = document.getElementById('pokok-branches');
    enableDragReorder(branchEl, branches, 'x');
  }
  function initPokokSubDrag(subEl){
    const subs = subEl.closest('.branch-subs');
    if(subs) enableDragReorder(subEl, subs, 'y');
  }

  function addBranch(){
    const branches = document.getElementById('pokok-branches');
    const n = branches.querySelectorAll('.pokok-branch').length + 1;
    const d = document.createElement('div');
    d.className = 'pokok-branch';
    d.innerHTML = `
      <div class="branch-top">
        <div class="drag-handle branch-handle" title="Seret kategori">⠿</div>
        <textarea class="map-input branch-cat" placeholder="Kategori ${n}"></textarea>
        <button class="del-branch-btn" onclick="this.closest('.pokok-branch').remove()">× Buang</button>
      </div>
      <div class="branch-divider"></div>
      <div class="branch-subs">
        <div class="sub-item"><div class="drag-handle sub-handle" title="Seret sub-item">⠿</div><textarea class="map-input sub-input" placeholder="Sub-item"></textarea><button class="del-btn" onclick="this.closest('.sub-item').remove()">×</button></div>
      </div>
      <button class="add-sub-btn" onclick="addSub(this)">+ Sub-item</button>`;
    branches.appendChild(d);
    initPokokBranchDrag(d);
    d.querySelectorAll('.sub-item').forEach(initPokokSubDrag);
  }

  function addSub(btn){
    const subs = btn.previousElementSibling;
    const n = subs.querySelectorAll('.sub-item').length + 1;
    const d = document.createElement('div');
    d.className = 'sub-item';
    d.innerHTML = `<div class="drag-handle sub-handle" title="Seret sub-item">⠿</div><textarea class="map-input sub-input" placeholder="Sub-item ${n}"></textarea><button class="del-btn" onclick="this.closest('.sub-item').remove()">×</button>`;
    subs.appendChild(d);
    initPokokSubDrag(d);
  }

  /* Peta Alir */
  function fixAlirArrows(){
    const flow = document.getElementById('alir-flow');
    if(!flow) return;
    const steps = Array.from(flow.querySelectorAll('.alir-step'));
    steps.forEach((step, i)=>{
      let arrow = step.querySelector('.alir-arrow');
      if(i < steps.length - 1){
        if(!arrow){
          arrow = document.createElement('div');
          arrow.className = 'alir-arrow';
          arrow.textContent = '→';
          step.appendChild(arrow);
        }
      } else if(arrow){
        arrow.remove();
      }
    });
  }

  function initAlirStepDrag(stepEl){
    const flow = document.getElementById('alir-flow');
    enableDragReorder(stepEl, flow, 'x', fixAlirArrows);
  }

  function addAlir(){
    const flow = document.getElementById('alir-flow');
    const steps = flow.querySelectorAll('.alir-step');
    const n = steps.length + 1;
    const d = document.createElement('div');
    d.className = 'alir-step';
    d.innerHTML = `<div class="step-box"><div class="drag-handle step-handle" title="Seret langkah">⠿</div><textarea class="map-input step-input" placeholder="Langkah ${n}"></textarea><button class="del-btn" onclick="delAlir(this)">×</button></div>`;
    flow.appendChild(d);
    initAlirStepDrag(d);
    fixAlirArrows();
  }

  function delAlir(btn){
    const flow = document.getElementById('alir-flow');
    const step = btn.closest('.alir-step');
    const steps = flow.querySelectorAll('.alir-step');
    if(steps.length <= 1) return;
    step.remove();
    fixAlirArrows();
  }

  /* Peta Dakap */
  function initDakapPartDrag(partEl){
    const parts = document.getElementById('dakap-parts');
    enableDragReorder(partEl, parts, 'y', resizeDakapBrace);
  }

  function addDakap(){
    const parts = document.getElementById('dakap-parts');
    const n = parts.querySelectorAll('.dakap-part').length + 1;
    const d = document.createElement('div');
    d.className = 'dakap-part';
    d.innerHTML = `<div class="drag-handle part-handle" title="Seret bahagian">⠿</div><textarea class="map-input dakap-part-input" placeholder="Bahagian ${n}"></textarea><button class="del-btn" onclick="this.closest('.dakap-part').remove(); resizeDakapBrace()">×</button>`;
    parts.appendChild(d);
    initDakapPartDrag(d);
    resizeDakapBrace();
  }

  function resizeDakapBrace(){
    const parts = document.getElementById('dakap-parts');
    const svg = document.getElementById('dakap-brace-svg');
    if(!svg || !parts) return;
    const h = Math.max(parts.offsetHeight, 100);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 44 ${h}`);
    const mid = h / 2;
    svg.querySelector('path').setAttribute('d',
      `M38,6 Q14,6 14,${Math.round(mid*0.52)} L14,${mid-4} Q14,${mid} 6,${mid} Q14,${mid} 14,${mid+4} L14,${Math.round(mid*1.48)} Q14,${h-6} 38,${h-6}`
    );
  }

  /* Initialise drag-reorder handlers for the tool items that are
     already present in the static HTML when the page loads. */
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('#pokok-branches > .pokok-branch').forEach(initPokokBranchDrag);
    document.querySelectorAll('.branch-subs > .sub-item').forEach(initPokokSubDrag);
    document.querySelectorAll('#alir-flow > .alir-step').forEach(initAlirStepDrag);
    document.querySelectorAll('#dakap-parts > .dakap-part').forEach(initDakapPartDrag);
    fixAlirArrows();
  });

  /* ---------- PRINT MAP ---------- */
  function printMap(){
    if(!currentMap) return;
    const mv = document.getElementById('mv-' + currentMap);
    const title = mapTitles[currentMap];

    // Collect values from all textareas/inputs in the map view
    // Build print-safe HTML by cloning and replacing inputs with values
    const clone = mv.cloneNode(true);
    // Remove drag handles (not meaningful on a printed page)
    clone.querySelectorAll('.drag-handle').forEach(h => h.remove());
    // Peta Bulatan: keep each idea box exactly where the user placed it
    // (the "orbit" layout), just rescaled to fit the print circle size.
    if(currentMap === 'bulatan'){
      const outerLive = document.getElementById('bulatan-outer');
      const outerClone = clone.querySelector('.bulatan-outer');
      if(outerClone && outerLive){
        const ring = outerClone.querySelector('.bulatan-inner-ring');
        if(ring) ring.remove();
        const liveSize = outerLive.clientWidth || 460;
        const printSize = 380; // matches .bulatan-outer width in the print stylesheet below
        const scale = printSize / liveSize;
        outerClone.querySelectorAll('.idea-node').forEach(n => {
          const left = parseFloat(n.style.left) || 0;
          const top = parseFloat(n.style.top) || 0;
          n.style.position = 'absolute';
          n.style.left = (left * scale) + 'px';
          n.style.top = (top * scale) + 'px';
          n.style.transform = 'translate(-50%,-50%)';
          n.style.margin = '0';
        });
      }
    }
    // Remove buttons
    clone.querySelectorAll('button').forEach(b => b.remove());
    // Replace textarea with styled div showing value
    clone.querySelectorAll('textarea').forEach(ta => {
      const orig = mv.querySelector(`[placeholder="${ta.placeholder}"]`);
      const val = orig ? orig.value : ta.value;
      const div = document.createElement('div');
      div.style.cssText = ta.style.cssText + '; padding:8px 12px; border:2px solid #cdb6f0; border-radius:10px; min-height:40px; font-size:0.88rem; white-space:pre-wrap; word-break:break-word; background:#fff;';
      // Copy class-based visual styles. Width/height/border-radius are read from
      // the live element's own inline style so a box the user resized (or that
      // auto-grew to fit long text) prints at its actual current size.
      if(ta.classList.contains('bulatan-topic')){
        div.style.cssText += `border-radius:${ta.style.borderRadius || '50%'}; background:#e9defa; text-align:center; font-weight:700; width:${ta.style.width || '130px'}; height:${ta.style.height || '80px'};`;
      }
      if(ta.closest('.idea-node')){
        div.style.cssText += `border-radius:${ta.style.borderRadius || '50%'}; background:#fff; text-align:center; display:flex; align-items:center; justify-content:center; padding:6px; width:${ta.style.width || '120px'}; height:${ta.style.height || '58px'};`;
      }
      if(ta.classList.contains('pokok-root-input')) div.style.cssText += 'background:#e9defa; text-align:center; font-weight:700; font-size:0.95rem; min-width:200px;';
      if(ta.classList.contains('branch-cat')) div.style.cssText += 'font-weight:700; background:#fff;';
      if(ta.classList.contains('dakap-main-input')) div.style.cssText += `background:#e9defa; font-weight:700; text-align:center; min-height:120px; width:${ta.style.width || '160px'}; height:${ta.style.height || 'auto'};`;
      div.textContent = val || ('(' + ta.placeholder + ')');
      if(!val) div.style.color = '#aaa';
      ta.parentNode.replaceChild(div, ta);
    });
    // Remove add-row, map-desc
    clone.querySelectorAll('.add-row, .map-desc').forEach(el => el.remove());

    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet">
<style>
body{font-family:'Manrope',sans-serif;padding:32px;color:#322747;background:#fff;}
h2{font-family:'Fraunces',serif;color:#5e3fae;margin-bottom:24px;font-size:1.4rem;}
.bulatan-outer{position:relative;overflow:hidden;border:3px dashed #9b7bd6;border-radius:50%;width:380px;height:380px;display:flex;align-items:center;justify-content:center;margin:0 auto;}
.bulatan-center-wrap{text-align:center;}
.bulatan-nodes{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px;justify-content:center;}
.idea-node{display:flex;align-items:center;gap:6px;}
.pokok-root{text-align:center;margin-bottom:10px;}
.pokok-connector{text-align:center;font-size:1.2rem;color:#9b7bd6;margin-bottom:6px;}
.pokok-branches{display:flex;gap:14px;flex-wrap:wrap;}
.pokok-branch{border:1px solid #e3d8f7;border-radius:14px;padding:12px 10px;min-width:140px;background:#f6f1fb;}
.branch-divider{width:2px;background:#9b7bd6;height:12px;margin:4px auto;}
.branch-subs{display:flex;flex-direction:column;gap:6px;margin-top:4px;}
.sub-item{display:flex;align-items:center;gap:4px;}
.alir-flow{display:flex;align-items:flex-start;flex-wrap:wrap;gap:6px;justify-content:center;}
.alir-step{display:flex;align-items:center;gap:6px;}
.step-box{display:flex;align-items:flex-start;gap:4px;}
.alir-arrow{font-size:1.4rem;color:#5e3fae;font-weight:700;}
.dakap-layout{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.dakap-parts{display:flex;flex-direction:column;gap:10px;}
.dakap-brace-svg{flex-shrink:0;}
@media print{@page{margin:20mm;} body{padding:0;}}
</style></head><body>
<h2>${title}</h2>
${clone.innerHTML}
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
    w.document.close();
  }
 
  /* ---------- QUIZ ---------- */
  const quizData = [
    {
      q: "Apakah prinsip utama dalam Teori Person-Centered?",
      options: ["Fokus kepada masalah klien","Kepercayaan kepada potensi diri klien","Menggunakan peneguhan positif","Mengubah tingkah laku klien"],
      correct: 1
    },
    {
      q: "Siapakah pengasas Teori Person-Centered?",
      options: ["Carl Rogers","Sigmund Freud","William Glasser","Aaron Beck"],
      correct: 0
    },
    {
      q: "Manakah BUKAN antara tiga keadaan teras dalam Person-Centered?",
      options: ["Empati","Penerimaan Tanpa Syarat","Ketulenan (Genuineness)","Peneguhan Negatif"],
      correct: 3
    },
    {
      q: "Dalam CBT, apa yang menjadi fokus utama intervensi?",
      options: ["Mimpi dan ketidaksedaran","Keperluan asas manusia","Pemikiran dan kepercayaan tidak rasional","Hubungan dengan ibu bapa"],
      correct: 2
    },
    {
      q: "Apakah teknik utama yang digunakan dalam CBT?",
      options: ["Penstrukturan semula kognitif","Analisis mimpi","Terapi kelompok sahaja","Hipnosis"],
      correct: 0
    },
    {
      q: "Apakah matlamat utama CBT?",
      options: ["Menggali ingatan zaman kanak-kanak","Mengubah corak pemikiran untuk mengubah tingkah laku","Memenuhi keperluan asas","Membina hubungan tanpa syarat"],
      correct: 1
    },
    {
      q: "Teori Realiti dikaitkan dengan tokoh manakah?",
      options: ["Carl Rogers","Sigmund Freud","William Glasser","Aaron Beck"],
      correct: 2
    },
    {
      q: "Berapakah jumlah keperluan asas manusia menurut Teori Realiti?",
      options: ["Tiga","Empat","Lima","Enam"],
      correct: 2
    },
    {
      q: "Teori Realiti menekankan fokus kepada apa?",
      options: ["Masa lalu klien","Tanggungjawab dan masa kini","Mimpi klien","Mekanisme pertahanan diri"],
      correct: 1
    },
    {
      q: "Apakah tiga struktur personaliti dalam Psikoanalisis?",
      options: ["Id, Ego, Superego","Otak, Minda, Jiwa","Sedar, Separa sedar, Tidak sedar sahaja","Emosi, Logik, Kemahuan"],
      correct: 0
    },
    {
      q: "Siapakah pengasas Teori Psikoanalisis?",
      options: ["Carl Rogers","Sigmund Freud","William Glasser","Aaron Beck"],
      correct: 1
    },
    {
      q: "Apakah istilah bagi cara individu melindungi diri daripada kecemasan dalam Psikoanalisis?",
      options: ["Peneguhan","Mekanisme pertahanan diri","Penstrukturan semula kognitif","Aktualisasi kendiri"],
      correct: 1
    },
    {
      q: "Manakah BUKAN salah satu daripada 4 alat kemahiran berfikir dalam modul ini?",
      options: ["Peta Bulatan","Peta Pokok","Peta Alir","Peta Minda Mandala"],
      correct: 3
    },
    {
      q: "Peta Bulatan digunakan untuk tujuan apa?",
      options: ["Brainstorming / meneroka idea","Membuat keputusan","Menghubung idea","Mengorganisasi maklumat sahaja"],
      correct: 0
    },
    {
      q: "Peta Pokok sesuai digunakan untuk?",
      options: ["Brainstorming bebas","Mengorganisasi maklumat mengikut kategori","Menghubungkan dua konsep","Membuat keputusan langkah demi langkah"],
      correct: 1
    },
    {
      q: "Peta Alir paling sesuai digunakan untuk?",
      options: ["Menyusun kategori","Brainstorming idea baharu","Proses membuat keputusan langkah demi langkah","Menghubung idea sokongan"],
      correct: 2
    },
    {
      q: "Peta Dakap digunakan untuk?",
      options: ["Menghubungkan konsep utama dengan idea sokongan","Membuat keputusan","Brainstorming idea","Mengingat semula mimpi"],
      correct: 0
    }
  ];
  let currentQ = 0;
  let answers = new Array(quizData.length).fill(null);
 
  function renderQuiz(){
    const data = quizData[currentQ];
    const area = document.getElementById('quizArea');
    area.innerHTML = `
      <p style="font-weight:700; color:var(--plum-deep); margin-bottom:4px;">Soalan ${currentQ+1} / ${quizData.length}</p>
      <h3 style="margin-top:0;">${data.q}</h3>
      <div id="optionsWrap"></div>
    `;
    const wrap = document.getElementById('optionsWrap');
    data.options.forEach((opt, i)=>{
      const el = document.createElement('button');
      el.className = 'option';
      el.textContent = opt;
      if(answers[currentQ]!==null){
        el.classList.add( answers[currentQ]===i ? 'selected':'' );
        if(answers[currentQ]!==null){
          if(i===data.correct) el.classList.add('correct');
          else if(i===answers[currentQ] && i!==data.correct) el.classList.add('wrong');
        }
      }
      el.onclick = ()=>selectAnswer(i);
      wrap.appendChild(el);
    });
    document.getElementById('progressFill').style.width = ((currentQ+1)/quizData.length*100)+'%';
  }
 
  function selectAnswer(i){
    answers[currentQ] = i;
    renderQuiz();
  }
 
  function nextQuestion(){
    if(currentQ < quizData.length-1){
      currentQ++;
      renderQuiz();
    } else {
      showResult();
    }
  }
  function prevQuestion(){
    if(currentQ>0){ currentQ--; renderQuiz(); }
  }
 
  function showResult(){
    let score = 0;
    quizData.forEach((d,i)=>{ if(answers[i]===d.correct) score++; });
    document.getElementById('quizArea').innerHTML = `
      <div class="quiz-result">
        <div class="score">${score}/${quizData.length}</div>
        <p style="color:var(--ink-soft); margin-top:10px;">Anda telah menjawab ${score} daripada ${quizData.length} soalan dengan betul.</p>
        <button class="btn" onclick="restartQuiz()" style="margin-top:18px;">Cuba Lagi</button>
      </div>
    `;
    document.getElementById('progressFill').style.width = '100%';
  }
 
  function restartQuiz(){
    currentQ = 0;
    answers = new Array(quizData.length).fill(null);
    renderQuiz();
  }
 
  renderQuiz();
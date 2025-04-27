/* app.js – UI logic, timers, localStorage */

(() => {
  const $ = id => document.getElementById(id);
  const pad = t => String(t).padStart(2,'0');
  const fmt = ms => {
    let s = Math.floor(ms/1000), h = pad(Math.floor(s/3600)); s %= 3600;
    return `${h}:${pad(Math.floor(s/60))}:${pad(s%60)}`;
  };

  /* state */
  let wStart=null, bStart=null, wMs=0, bMs=0, tick=null;
  const storageKey = 'wombatData';

  const update = () => {
    $('elapsedTime').textContent = fmt(wMs);
    $('breakTime' ).textContent = fmt(bMs);
  };

  /* --- buttons ------------------------------------------------------- */
  $('startBtn').onclick = () => {
    const nowIso = new Date().toISOString().slice(0,16);
    $('startDateTime').value = nowIso;
    $('endDateTime').value   = nowIso;

    wMs = bMs = 0; wStart = Date.now(); update();

    $('startBtn').disabled=true; $('pauseBtn').disabled=false;
    $('resumeBtn').disabled=true; $('finishBtn').disabled=false;

    tick = setInterval(() => {
      const now = Date.now(); wMs += now - wStart; wStart = now; update();
    }, 1000);
  };

  $('pauseBtn').onclick = () => {
    bStart = Date.now(); clearInterval(tick);
    $('pauseBtn').disabled=true; $('resumeBtn').disabled=false;
  };

  $('resumeBtn').onclick = () => {
    if (bStart) { bMs += Date.now() - bStart; bStart=null; }
    wStart = Date.now();
    tick = setInterval(() => {
      const now = Date.now(); wMs += now - wStart; wStart = now; update();
    }, 1000);
    $('pauseBtn').disabled=false; $('resumeBtn').disabled=true;
  };

  $('finishBtn').onclick = () => {
    clearInterval(tick);
    if (bStart) { bMs += Date.now() - bStart; bStart=null; }
    if (wStart) { wMs += Date.now() - wStart; wStart=null; }
    $('endDateTime').value = new Date().toISOString().slice(0,16); update();

    $('startBtn').disabled=false;
    $('pauseBtn').disabled=$('resumeBtn').disabled=$('finishBtn').disabled=true;
  };

  /* --- submit -------------------------------------------------------- */
  $('dataForm').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target), rec = {};
    ['contractorName','location','startDateTime','endDateTime',
     'newBurrows','checkedBurrows','usedBurrows'].forEach(k => rec[k]=f.get(k));
    rec.totalWork = fmt(wMs); rec.totalBreak = fmt(bMs); rec.timestamp = new Date().toString();

    const arr = JSON.parse(localStorage.getItem(storageKey)||'[]');
    arr.push(rec); localStorage.setItem(storageKey, JSON.stringify(arr));

    e.target.reset(); wMs=bMs=0; update();
    $('startBtn').disabled=false;
    $('pauseBtn').disabled=$('resumeBtn').disabled=$('finishBtn').disabled=true;
    alert('Saved locally (offline).');
  };

  /* --- view stored --------------------------------------------------- */
  $('viewDataBtn').onclick = () => {
    const data = JSON.parse(localStorage.getItem(storageKey)||'[]'),
          list = $('storedDataList');
    list.innerHTML = data.length
      ? data.map((d,i)=>`<div class="stored-entry">
          <p><strong>#${i+1}</strong> (${d.timestamp})</p>
          <p><strong>Contractor:</strong> ${d.contractorName}</p>
          <p><strong>Location:</strong> ${d.location}</p>
          <p><strong>Start:</strong> ${d.startDateTime}</p>
          <p><strong>Finish:</strong> ${d.endDateTime}</p>
          <p>New: ${d.newBurrows} | Checked: ${d.checkedBurrows} | Used: ${d.usedBurrows}</p>
          <p>Work: ${d.totalWork} | Break: ${d.totalBreak}</p>
        </div>`).join('')
      : '<p>No submissions.</p>';
    $('storedDataModal').style.display = 'flex';
  };
  $('closeModalBtn').onclick = ()=>$('storedDataModal').style.display='none';
  $('storedDataModal').onclick = e=>{if(e.target.id==='storedDataModal')e.target.style.display='none';};

  /* --- register service-worker -------------------------------------- */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(console.error);
  }
})();

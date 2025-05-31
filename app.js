/* app.js – UI logic, timers, localStorage */

(() => {
  const $ = id => document.getElementById(id);
  const pad = t => String(t).padStart(2,'0');
  const fmt = ms => {
    let s = Math.floor(ms/1000), h = pad(Math.floor(s/3600)); s %= 3600;
    return `${h}:${pad(Math.floor(s/60))}:${pad(s%60)}`;
  };

  /* state */
  let wStart=null, bStart=null, wMs=0, bMs=0, tick=null, isTimerActive=false;
  const storageKey = 'wombatData';

  const update = () => {
    $('elapsedTime').textContent = fmt(wMs);
    $('breakTime').textContent = fmt(bMs);
  };

  // Initialize with current time if fields are empty
  const initializeDateTime = () => {
    const now = new Date();
    const nowIso = now.toISOString().slice(0,16);
    
    if (!$('startDateTime').value) {
      $('startDateTime').value = nowIso;
    }
    if (!$('endDateTime').value) {
      $('endDateTime').value = nowIso;
    }
  };

  // Validate that end time is after start time
  const validateDateTimeRange = () => {
    const startTime = new Date($('startDateTime').value);
    const endTime = new Date($('endDateTime').value);
    
    if (endTime < startTime) {
      $('endDateTime').value = $('startDateTime').value;
    }
  };

  // Add event listeners for date/time validation
  $('startDateTime').addEventListener('change', validateDateTimeRange);
  $('endDateTime').addEventListener('change', validateDateTimeRange);

  /* --- buttons ------------------------------------------------------- */
  $('startBtn').onclick = () => {
    // Set current time if fields are empty or update start time to now
    const nowIso = new Date().toISOString().slice(0,16);
    if (!$('startDateTime').value) {
      $('startDateTime').value = nowIso;
    }
    // Update end time to current time initially (user can modify later)
    $('endDateTime').value = nowIso;

    wMs = bMs = 0; 
    wStart = Date.now(); 
    isTimerActive = true;
    update();

    $('startBtn').disabled = true; 
    $('pauseBtn').disabled = false;
    $('resumeBtn').disabled = true; 
    $('finishBtn').disabled = false;

    tick = setInterval(() => {
      const now = Date.now(); 
      wMs += now - wStart; 
      wStart = now; 
      update();
      
      // Auto-update end time while timer is running (user can still edit manually)
      const currentTime = new Date().toISOString().slice(0,16);
      if (isTimerActive) {
        $('endDateTime').value = currentTime;
      }
    }, 1000);
  };

  $('pauseBtn').onclick = () => {
    bStart = Date.now(); 
    clearInterval(tick);
    isTimerActive = false;
    $('pauseBtn').disabled = true; 
    $('resumeBtn').disabled = false;
  };

  $('resumeBtn').onclick = () => {
    if (bStart) { 
      bMs += Date.now() - bStart; 
      bStart = null; 
    }
    wStart = Date.now();
    isTimerActive = true;
    
    tick = setInterval(() => {
      const now = Date.now(); 
      wMs += now - wStart; 
      wStart = now; 
      update();
      
      // Auto-update end time while timer is running
      const currentTime = new Date().toISOString().slice(0,16);
      if (isTimerActive) {
        $('endDateTime').value = currentTime;
      }
    }, 1000);
    
    $('pauseBtn').disabled = false; 
    $('resumeBtn').disabled = true;
  };

  $('finishBtn').onclick = () => {
    clearInterval(tick);
    isTimerActive = false;
    
    if (bStart) { 
      bMs += Date.now() - bStart; 
      bStart = null; 
    }
    if (wStart) { 
      wMs += Date.now() - wStart; 
      wStart = null; 
    }
    
    // Set final end time to current time (user can still edit if needed)
    $('endDateTime').value = new Date().toISOString().slice(0,16); 
    update();

    $('startBtn').disabled = false;
    $('pauseBtn').disabled = $('resumeBtn').disabled = $('finishBtn').disabled = true;
  };

  /* --- submit -------------------------------------------------------- */
  $('dataForm').onsubmit = e => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['contractorName', 'location', 'startDateTime', 'endDateTime', 'newBurrows', 'checkedBurrows', 'usedBurrows'];
    const missingFields = requiredFields.filter(field => !$(field).value.trim());
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate date/time range
    const startTime = new Date($('startDateTime').value);
    const endTime = new Date($('endDateTime').value);
    
    if (endTime < startTime) {
      alert('Finish time cannot be before start time. Please check your dates.');
      return;
    }

    const f = new FormData(e.target), rec = {};
    requiredFields.forEach(k => rec[k] = f.get(k));
    
    // Calculate actual time difference if user has manually set different times
    const actualWorkMs = endTime.getTime() - startTime.getTime();
    const actualWorkTime = fmt(actualWorkMs);
    
    rec.totalWork = fmt(wMs); 
    rec.actualWorkTime = actualWorkTime;
    rec.totalBreak = fmt(bMs); 
    rec.timestamp = new Date().toString();

    const arr = JSON.parse(localStorage.getItem(storageKey)||'[]');
    arr.push(rec); 
    localStorage.setItem(storageKey, JSON.stringify(arr));

    // Reset form and timer state
    e.target.reset(); 
    wMs = bMs = 0; 
    isTimerActive = false;
    update();
    
    $('startBtn').disabled = false;
    $('pauseBtn').disabled = $('resumeBtn').disabled = $('finishBtn').disabled = true;
    
    // Show success message with better styling
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: #10b981; color: white; padding: 1rem 1.5rem;
      border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: 600; animation: slideIn 0.3s ease;
    `;
    successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Data saved successfully!';
    document.body.appendChild(successMsg);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      successMsg.remove();
      style.remove();
    }, 3000);
  };

  /* --- view stored --------------------------------------------------- */
  $('viewDataBtn').onclick = () => {
    const data = JSON.parse(localStorage.getItem(storageKey)||'[]');
    const list = $('storedDataList');
    
    list.innerHTML = data.length
      ? data.map((d,i)=>`
          <div class="stored-entry">
            <p><strong>#${i+1}</strong> <small style="color: #6b7280;">(${new Date(d.timestamp).toLocaleString()})</small></p>
            <p><strong>Contractor:</strong> ${d.contractorName}</p>
            <p><strong>Location:</strong> ${d.location}</p>
            <p><strong>Start:</strong> ${new Date(d.startDateTime).toLocaleString()}</p>
            <p><strong>Finish:</strong> ${new Date(d.endDateTime).toLocaleString()}</p>
            <p><strong>Burrows:</strong> New: ${d.newBurrows} | Checked: ${d.checkedBurrows} | Used: ${d.usedBurrows}</p>
            <p><strong>Timer:</strong> Work: ${d.totalWork} | Break: ${d.totalBreak}</p>
            ${d.actualWorkTime ? `<p><strong>Actual Duration:</strong> ${d.actualWorkTime}</p>` : ''}
          </div>
        `).join('')
      : '<p style="text-align: center; color: #6b7280; padding: 2rem;">No submissions yet.</p>';
    
    $('storedDataModal').style.display = 'flex';
  };

  $('closeModalBtn').onclick = () => $('storedDataModal').style.display = 'none';
  $('storedDataModal').onclick = e => {
    if(e.target.id === 'storedDataModal') {
      e.target.style.display = 'none';
    }
  };

  /* --- initialization ------------------------------------------------ */
  // Initialize date/time fields when page loads
  initializeDateTime();

  /* --- register service-worker -------------------------------------- */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(console.error);
  }
})();

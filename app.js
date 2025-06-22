/* app.js – UI logic, timers, localStorage, background persistence */

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
  const timerStateKey = 'wombatTimerState';

  // Background persistence - save timer state
  const saveTimerState = () => {
    const state = {
      wStart: wStart,
      bStart: bStart,
      wMs: wMs,
      bMs: bMs,
      isTimerActive: isTimerActive,
      timestamp: Date.now()
    };
    localStorage.setItem(timerStateKey, JSON.stringify(state));
  };

  // Background persistence - restore timer state
  const restoreTimerState = () => {
    const savedState = localStorage.getItem(timerStateKey);
    if (!savedState) return;

    try {
      const state = JSON.parse(savedState);
      const timeDiff = Date.now() - state.timestamp;

      wMs = state.wMs || 0;
      bMs = state.bMs || 0;
      isTimerActive = state.isTimerActive || false;

      // If timer was active when app was closed, add the time that passed
      if (state.isTimerActive && state.wStart) {
        wMs += timeDiff;
        wStart = Date.now(); // Reset start time to now
        
        // Restart the timer
        startTimerTick();
        
        // Update button states
        $('startBtn').disabled = true;
        $('pauseBtn').disabled = false;
        $('resumeBtn').disabled = true;
        $('finishBtn').disabled = false;
      } else if (state.bStart) {
        // If was on break, add break time
        bMs += timeDiff;
        bStart = Date.now();
        
        // Update button states for pause
        $('startBtn').disabled = true;
        $('pauseBtn').disabled = true;
        $('resumeBtn').disabled = false;
        $('finishBtn').disabled = false;
      }

      update();
      
      // Show restoration message
      if (state.isTimerActive || state.bStart) {
        showNotification('Timer restored from background', 'info');
      }
    } catch (e) {
      console.error('Error restoring timer state:', e);
      localStorage.removeItem(timerStateKey);
    }
  };

  // Reset function - clears all data and timer state
  const resetAll = () => {
    // Confirm with user
    if (!confirm('Are you sure you want to reset all data? This will clear the form and stop the timer.')) {
      return;
    }

    // Stop timer
    clearInterval(tick);
    tick = null;
    
    // Reset timer state
    wStart = bStart = null;
    wMs = bMs = 0;
    isTimerActive = false;
    
    // Clear timer state from storage
    localStorage.removeItem(timerStateKey);
    
    // Reset form
    $('dataForm').reset();
    
    // Reset button states
    $('startBtn').disabled = false;
    $('pauseBtn').disabled = true;
    $('resumeBtn').disabled = true;
    $('finishBtn').disabled = true;
    
    // Update display
    update();
    
    // Reinitialize date/time fields
    initializeDateTime();
    
    // Show success message
    showNotification('All data has been reset', 'success');
  };

  // Notification helper
  const showNotification = (message, type = 'info') => {
    const colors = {
      success: '#10b981',
      info: '#0ea5e9',
      warning: '#f59e0b',
      error: '#ef4444'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: ${colors[type]}; color: white; padding: 1rem 1.5rem;
      border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: 600; animation: slideIn 0.3s ease;
      max-width: 300px; word-wrap: break-word;
    `;
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    document.body.appendChild(notification);

    // Add animation styles if not already present
    if (!document.querySelector('#notificationStyles')) {
      const style = document.createElement('style');
      style.id = 'notificationStyles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      notification.remove();
    }, 4000);
  };

  // Timer tick function
  const startTimerTick = () => {
    if (tick) clearInterval(tick);
    
    tick = setInterval(() => {
      const now = Date.now();
      wMs += now - wStart;
      wStart = now;
      update();
      
      // Auto-update end time while timer is running
      const currentTime = getLocalDateTimeString();
      if (isTimerActive) {
        $('endDateTime').value = currentTime;
      }
      
      // Save state for background persistence
      saveTimerState();
    }, 1000);
  };

  const update = () => {
    $('elapsedTime').textContent = fmt(wMs);
    $('breakTime').textContent = fmt(bMs);
  };

  // Initialize with current time if fields are empty
  const initializeDateTime = () => {
    const nowIso = getLocalDateTimeString();
    
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

  // Helper function to get local datetime string
  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  /* --- buttons ------------------------------------------------------- */
  $('startBtn').onclick = () => {
    // Set current time if fields are empty or update start time to now
    const nowIso = getLocalDateTimeString();
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

    startTimerTick();
    saveTimerState();
  };

  $('pauseBtn').onclick = () => {
    bStart = Date.now(); 
    clearInterval(tick);
    isTimerActive = false;
    $('pauseBtn').disabled = true; 
    $('resumeBtn').disabled = false;
    saveTimerState();
  };

  $('resumeBtn').onclick = () => {
    if (bStart) { 
      bMs += Date.now() - bStart; 
      bStart = null; 
    }
    wStart = Date.now();
    isTimerActive = true;
    
    startTimerTick();
    
    $('pauseBtn').disabled = false; 
    $('resumeBtn').disabled = true;
    saveTimerState();
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
    $('endDateTime').value = getLocalDateTimeString(); 
    update();

    $('startBtn').disabled = false;
    $('pauseBtn').disabled = $('resumeBtn').disabled = $('finishBtn').disabled = true;
    
    // Clear timer state since timer is finished
    localStorage.removeItem(timerStateKey);
  };

  // Reset button handler
  $('resetBtn').onclick = resetAll;

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
    
    // Clear timer state after successful submission
    localStorage.removeItem(timerStateKey);
    
    // Show success message
    showNotification('Data saved successfully!', 'success');
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
  
  // Restore timer state if app was running in background
  restoreTimerState();

  /* --- register service-worker -------------------------------------- */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(console.error);
  }

  // Handle visibility change for background persistence
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // App is going to background, save state
      saveTimerState();
    } else {
      // App is coming back to foreground, restore state
      restoreTimerState();
    }
  });

  // Handle page unload for mobile devices
  window.addEventListener('beforeunload', saveTimerState);
  window.addEventListener('pagehide', saveTimerState);
})();

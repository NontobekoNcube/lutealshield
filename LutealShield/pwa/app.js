/**
 * LutealShield - Pure Vanilla JavaScript Core App
 * Prefix for all localStorage: lutealshield_
 */

// Available Symptoms Catalog for Onboarding & PMDD Profile
const PMDD_SYMPTOMS_CATALOG = {
  emotional: [
    "Rage/Irritability",
    "Anxiety",
    "Depression",
    "Emotional numbness",
    "Dissociation",
    "Mood crashes",
    "Rejection sensitivity"
  ],
  physical: [
    "Light sensitivity",
    "Sound sensitivity",
    "Brain fog",
    "Fatigue",
    "Joint pain",
    "Headache",
    "Bloating"
  ],
  behavioural: [
    "Social withdrawal",
    "Sleep disturbance",
    "Food cravings",
    "Impulsivity"
  ]
};

// Initialize Storage with Realistic PMDD Defaults if clean
function initStorageDefaults() {
  if (!localStorage.getItem('lutealshield_zone')) {
    localStorage.setItem('lutealshield_zone', 'green');
  }
  if (!localStorage.getItem('lutealshield_user_type')) {
    localStorage.setItem('lutealshield_user_type', 'I have PMDD');
  }
  if (!localStorage.getItem('lutealshield_cycle')) {
    localStorage.setItem('lutealshield_cycle', JSON.stringify({
      periodStart: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
      cycleLength: 28,
      lutealLength: 14,
      syncHealth: false
    }));
  }
  if (!localStorage.getItem('lutealshield_symptoms')) {
    localStorage.setItem('lutealshield_symptoms', JSON.stringify([
      "Rage/Irritability",
      "Anxiety",
      "Depression",
      "Light sensitivity",
      "Sound sensitivity",
      "Brain fog",
      "Social withdrawal",
      "Sleep disturbance"
    ]));
  }
  if (!localStorage.getItem('lutealshield_tether')) {
    localStorage.setItem('lutealshield_tether', JSON.stringify([
      { id: '1', name: 'Zinhle', role: 'Best friend', phone: '+27825550192', method: 'call' },
      { id: '2', name: 'Thando', role: 'Partner', phone: '+27834448219', method: 'whatsapp' },
      { id: '3', name: 'Mama', role: 'Family', phone: '+27843337100', method: 'call' }
    ]));
  }
  if (!localStorage.getItem('lutealshield_pocket')) {
    localStorage.setItem('lutealshield_pocket', JSON.stringify([
      {
        id: '1',
        type: 'voice_note',
        title: "Mom's Voice Note",
        desc: "You are loved, you are safe, this feeling will pass as your hormones reset.",
        quote: "Mom's Voice Note • 0:42",
        duration: "0:42"
      },
      {
        id: '2',
        type: 'rule',
        title: "The 72-Hour Luteal Rule",
        desc: "Your steady-self made a covenant: 'Wait 72 hours before quitting your job, breaking up, or confronting someone. The storm is chemical, not factual.'",
        quote: "Wait 72 hours before quitting. The storm is chemical, not factual."
      },
      {
        id: '3',
        type: 'proof',
        title: "Graduation Proof: 100% Historic Survival Rate",
        desc: "You have weathered every single luteal crash before this one. 100% survival record.",
        quote: "100% historic cycle survival rate."
      },
      {
        id: '4',
        type: 'memory',
        title: "Porch Sunlight After Bleeding",
        desc: "Sitting on the porch with warm tea last month when bleeding arrived. The calm returned within 2 hours.",
        quote: "The calm returned within 2 hours."
      },
      {
        id: '5',
        type: 'anchor',
        title: "Sensory Permission",
        desc: "It is okay to put on noise-cancelling headphones, dim every light, and cancel plans without guilt.",
        quote: "Permission granted to rest."
      },
      {
        id: '6',
        type: 'affirmation',
        title: "Steady Baseline Covenant",
        desc: "My worth does not decrease when my progesterone drops. I am simply navigating biological turbulence.",
        quote: "Biological turbulence is temporary."
      }
    ]));
  }
  if (!localStorage.getItem('lutealshield_settings')) {
    localStorage.setItem('lutealshield_settings', JSON.stringify({
      autoDarkMode: true,
      amberGlow: true,
      reduceMotion: false,
      largerText: false,
      quietMode: false,
      lowFrictionLanguage: true,
      biometricLock: false,
      safeguard72h: true,
      preferVoiceNotes: true
    }));
  }
}

// Global Zone Initialization - runs on every page load
function initZone() {
  initStorageDefaults();
  const zone = localStorage.getItem('lutealshield_zone') || 'green';
  const settings = JSON.parse(localStorage.getItem('lutealshield_settings') || '{}');

  document.documentElement.setAttribute('data-zone', zone);

  // Red Zone = Automatic dark mode
  if (zone === 'red') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  // Rose Amber Glow Filter (Active when in amber zone or enabled in settings)
  if (zone === 'amber' && settings.amberGlow !== false) {
    document.body.classList.add('rose-amber-glow');
  } else {
    document.body.classList.remove('rose-amber-glow');
  }

  // Neuro-Gentle accessibility preferences
  if (settings.largerText) {
    document.body.classList.add('larger-text-mode');
  } else {
    document.body.classList.remove('larger-text-mode');
  }

  if (settings.reduceMotion) {
    document.body.classList.add('reduce-motion-mode');
  } else {
    document.body.classList.remove('reduce-motion-mode');
  }

  // Update simulator button states if present
  const zoneBtns = document.querySelectorAll('.zone-btn');
  zoneBtns.forEach(btn => {
    btn.classList.remove('active-green', 'active-amber', 'active-red');
    const bZone = btn.getAttribute('data-zone-val');
    if (bZone === zone) {
      btn.classList.add(`active-${zone}`);
    }
  });

  // Dispatch custom event for page listeners
  window.dispatchEvent(new CustomEvent('zoneChanged', { detail: { zone } }));
}

// Set Zone and save
function setZone(newZone) {
  if (['green', 'amber', 'red'].includes(newZone)) {
    localStorage.setItem('lutealshield_zone', newZone);
    initZone();
    // Refresh cycle radar/banners if on home
    if (typeof updateHomeView === 'function') {
      updateHomeView();
    }
  }
}

// Cycle calculation helper
function getCycleData() {
  const cycle = JSON.parse(localStorage.getItem('lutealshield_cycle') || '{"cycleLength": 28, "lutealLength": 14}');
  const periodStart = new Date(cycle.periodStart || Date.now() - 12 * 86400000);
  const now = new Date();
  const diffDays = Math.floor((now - periodStart) / (1000 * 60 * 60 * 24)) % (cycle.cycleLength || 28);
  const currentDay = diffDays >= 0 ? diffDays + 1 : 1;
  const cycleLen = cycle.cycleLength || 28;
  const lutealLen = cycle.lutealLength || 14;
  const ovulationDay = cycleLen - lutealLen;
  const redZoneStart = cycleLen - 6; // last 6 days of cycle

  let phase = "Follicular Phase";
  let zone = "green";
  let countdownText = `${ovulationDay - currentDay} days to ovulation`;

  if (currentDay >= redZoneStart) {
    phase = "Late Luteal Phase";
    zone = "red";
    const daysToRelief = (cycleLen - currentDay) + 1;
    countdownText = `Active Red Zone • ~${daysToRelief} days until follicular reset`;
  } else if (currentDay >= ovulationDay) {
    phase = "Early Luteal Phase";
    zone = "amber";
    const daysToRed = redZoneStart - currentDay;
    countdownText = `72h Early Warning • Red Zone starts in ~${daysToRed} days`;
  } else {
    phase = "Follicular Phase";
    zone = "green";
    countdownText = `Steady baseline • ${ovulationDay - currentDay} days to ovulation`;
  }

  return {
    currentDay,
    cycleLength: cycleLen,
    lutealLength: lutealLen,
    phase,
    suggestedZone: zone,
    countdownText
  };
}

// PWA Service Worker Registration & In-App Install
let deferredPrompt = null;

function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('ServiceWorker registered:', reg.scope))
        .catch(err => console.log('ServiceWorker registration error:', err));
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBanner = document.getElementById('pwa-install-banner');
    if (installBanner) {
      installBanner.style.display = 'flex';
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const installBanner = document.getElementById('pwa-install-banner');
    if (installBanner) {
      installBanner.style.display = 'none';
    }
  });
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      deferredPrompt = null;
      const installBanner = document.getElementById('pwa-install-banner');
      if (installBanner) installBanner.style.display = 'none';
    });
  } else {
    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert("To install LutealShield on iPhone/iPad:\n1. Tap the Share button in Safari toolbar.\n2. Tap 'Add to Home Screen'.");
    } else {
      alert("To install LutealShield, tap your browser's menu (⋮) and choose 'Add to Home screen' or 'Install app'.");
    }
  }
}

// Soft Audio Synthesizer for Voice Notes & Grounding
function playCalmTone(durationSeconds = 3) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle binaural 174 Hz (Solfeggio frequency associated with safety)
    osc.frequency.setValueAtTime(174, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(216, ctx.currentTime + durationSeconds);

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSeconds);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationSeconds);
  } catch (e) {
    console.log("Audio not allowed yet without user gesture", e);
  }
}

// Auto-run initZone on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initZone();
  setupPWA();
});

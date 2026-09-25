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
    "Shame spirals",
    "Urge to end relationships",
    "Self-harm thoughts",
    "Suicidal thoughts",
    "Feeling like a burden",
    "Feeling like a failure",
    "Feeling like a fraud",
    "Feeling like a monster",
    "Paranoia about loved ones leaving",
  ],
  physical: [
    "Light sensitivity",
    "Sound sensitivity",
    "Brain fog",
    "Fatigue",
    "Joint pain",
    "Headache",
    "Bloating",
    "Extreme cravings",
    "Sleepiness or insomnia",

  ],
  cognitive: [
    "Memory lapses",
    "Difficulty concentrating",
    "Decision-making paralysis",
    "Slowed thinking",
    "Confusion",
    "Overwhelm from simple tasks",
  ],
  relational: [
    "Social withdrawal",
    "Conflict with loved ones",
    "Rejection sensitivity",
    "Urge to isolate completely",
    "Feeling unloved/unwanted",
    "Rage towards loved ones",
  ]
};

const STORAGE_KEYS = {
  zone: 'lutealshield_zone',
  userType: 'lutealshield_user_type',
  cycle: 'lutealshield_cycle',
  symptoms: 'lutealshield_symptoms',
  tether: 'lutealshield_tether',
  pocket: 'lutealshield_pocket',
  settings: 'lutealshield_settings',
  onboarded: 'lutealshield_onboarded',
  profileMeta: 'lutealshield_profile_meta',
  onboardingProgress: 'lutealshield_onboarding_progress'
};

const APP_DEFAULT_SETTINGS = {
  autoDarkMode: true,
  amberGlow: true,
  reduceMotion: false,
  largerText: false,
  quietMode: false,
  lowFrictionLanguage: true,
  biometricLock: false,
  safeguard72h: true,
  preferVoiceNotes: true
};

const STARTER_ANCHORS = [
  { id: 'starter-rule', type: 'rule', title: 'The 72-Hour Luteal Rule', desc: 'Wait 72 hours before making an irreversible decision. The storm is temporary.', quote: 'Wait 72 hours before deciding.' },
  { id: 'starter-proof', type: 'proof', title: 'Historic Survival Proof', desc: 'Every previous luteal crash ended. The calm returned each time.', quote: 'The calm has returned before.' },
  { id: 'starter-anchor', type: 'anchor', title: 'Sensory Permission', desc: 'It is okay to dim the lights, reduce noise, cancel plans, and rest without guilt.', quote: 'Permission granted to rest.' }
];

const DEMO_PROFILE = {
  userType: 'I have PMDD',
  cycle: { periodStart: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], cycleLength: 28, lutealLength: 14, syncHealth: false },
  symptoms: ['Rage/Irritability', 'Anxiety', 'Depression', 'Light sensitivity', 'Sound sensitivity', 'Brain fog'],
  tether: [
    { id: 'demo-1', name: 'Zinhle', role: 'Best friend', phone: '+27825550192', method: 'call' },
    { id: 'demo-2', name: 'Thando', role: 'Partner', phone: '+27834448219', method: 'whatsapp' },
    { id: 'demo-3', name: 'Mama', role: 'Family', phone: '+27843337100', method: 'call' }
  ],
  pocket: STARTER_ANCHORS
};

function readText(key, fallback = '') {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value;
}

function writeText(key, value) {
  localStorage.setItem(key, String(value));
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.warn(`Ignoring invalid local data for ${key}`, error);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUserType() { return readText(STORAGE_KEYS.userType); }
function saveUserType(value) { writeText(STORAGE_KEYS.userType, value); }
function getCycle() { return readJSON(STORAGE_KEYS.cycle, null); }
function saveCycle(value) { writeJSON(STORAGE_KEYS.cycle, value); }
function getSymptoms() { return readJSON(STORAGE_KEYS.symptoms, []); }
function saveSymptoms(value) { writeJSON(STORAGE_KEYS.symptoms, value); }
function getTether() { return readJSON(STORAGE_KEYS.tether, []); }
function saveTether(value) { writeJSON(STORAGE_KEYS.tether, value); }
function getPocket() { return readJSON(STORAGE_KEYS.pocket, []); }
function savePocket(value) { writeJSON(STORAGE_KEYS.pocket, value); }
function getSettings() { return readJSON(STORAGE_KEYS.settings, { ...APP_DEFAULT_SETTINGS }); }
function saveSettings(value) { writeJSON(STORAGE_KEYS.settings, value); }
function getProfileMeta() { return readJSON(STORAGE_KEYS.profileMeta, null); }
function saveProfileMeta(value) { writeJSON(STORAGE_KEYS.profileMeta, value); }
function getOnboardingProgress() { return readJSON(STORAGE_KEYS.onboardingProgress, null); }
function saveOnboardingProgress(value) { writeJSON(STORAGE_KEYS.onboardingProgress, value); }
function clearOnboardingProgress() { localStorage.removeItem(STORAGE_KEYS.onboardingProgress); }

function isValidStoredCycle(cycle) {
  if (!cycle || !/^\d{4}-\d{2}-\d{2}$/.test(cycle.periodStart || '')) return false;
  const start = new Date(`${cycle.periodStart}T00:00:00`);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return !Number.isNaN(start.getTime()) && start <= today
    && Number.isInteger(cycle.cycleLength) && cycle.cycleLength >= 21 && cycle.cycleLength <= 40
    && Number.isInteger(cycle.lutealLength) && cycle.lutealLength >= 10 && cycle.lutealLength <= 18
    && cycle.lutealLength < cycle.cycleLength;
}

function hasCompletedUserProfile() {
  const meta = getProfileMeta();
  const symptoms = getSymptoms();
  const tether = getTether();
  const pocket = getPocket();
  return readText(STORAGE_KEYS.onboarded) === 'true'
    && meta?.source === 'user'
    && Boolean(getUserType())
    && isValidStoredCycle(getCycle())
    && Array.isArray(symptoms) && symptoms.length > 0
    && Array.isArray(tether)
    && Array.isArray(pocket);
}

function completeOnboarding() {
  saveProfileMeta({ version: 1, source: 'user', completedAt: new Date().toISOString() });
  writeText(STORAGE_KEYS.onboarded, 'true');
}

function seedDemoData() {
  saveUserType(DEMO_PROFILE.userType);
  saveCycle(DEMO_PROFILE.cycle);
  saveSymptoms(DEMO_PROFILE.symptoms);
  saveTether(DEMO_PROFILE.tether);
  savePocket(DEMO_PROFILE.pocket);
  saveProfileMeta({ version: 1, source: 'demo', completedAt: new Date().toISOString() });
  writeText(STORAGE_KEYS.onboarded, 'true');
}

function resetDemoData() {
  if (getProfileMeta()?.source !== 'demo') return false;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  initStorageDefaults();
  return true;
}

// Personal profile data is created only by onboarding or explicit demo seeding.
function initStorageDefaults() {
  if (!localStorage.getItem(STORAGE_KEYS.zone)) writeText(STORAGE_KEYS.zone, 'green');
  if (!localStorage.getItem(STORAGE_KEYS.settings)) saveSettings({ ...APP_DEFAULT_SETTINGS });
  if (!localStorage.getItem(STORAGE_KEYS.symptoms)) saveSymptoms([]);
  if (!localStorage.getItem(STORAGE_KEYS.tether)) saveTether([]);
  if (!localStorage.getItem(STORAGE_KEYS.pocket)) savePocket([]);
}

// Global Zone Initialization - runs on every page load
function initZone() {
  initStorageDefaults();
  const zone = localStorage.getItem('lutealshield_zone') || 'green';
  const settings = getSettings();

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
  const cycle = getCycle() || { cycleLength: 28, lutealLength: 14 };
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

let currentStep = 0;
const totalSteps = 5;
let selectedSymptoms = [];
let tetherContacts = [];
let onboardingProgress = null;
let progressStarted = false;

function createProgress(fromProfile = false) {
  const settings = getSettings();
  const cycle = fromProfile ? (getCycle() || {}) : {};
  return {
    version: 1,
    currentStep: fromProfile ? 1 : 0,
    updatedAt: new Date().toISOString(),
    answers: {
      userType: fromProfile ? getUserType() : '',
      cycle: {
        periodStart: cycle.periodStart || '',
        cycleLength: Number.isInteger(cycle.cycleLength) ? cycle.cycleLength : 28,
        lutealLength: Number.isInteger(cycle.lutealLength) ? cycle.lutealLength : 14,
        syncHealth: false
      },
      symptoms: fromProfile ? getSymptoms() : [],
      tether: fromProfile ? getTether() : [],
      safeguards: {
        safeguard72h: settings.safeguard72h !== false,
        preferVoiceNotes: settings.preferVoiceNotes !== false
      },
      anchorDraft: { title: '', type: 'anchor', desc: '' }
    }
  };
}

function normalizeProgress(value) {
  const clean = createProgress(false);
  if (!value || value.version !== 1 || !value.answers) return clean;
  clean.currentStep = Number.isInteger(value.currentStep) && value.currentStep >= 0 && value.currentStep <= totalSteps
    ? value.currentStep : 1;
  clean.answers.userType = typeof value.answers.userType === 'string' ? value.answers.userType : '';
  clean.answers.cycle = { ...clean.answers.cycle, ...(value.answers.cycle || {}), syncHealth: false };
  clean.answers.symptoms = Array.isArray(value.answers.symptoms) ? value.answers.symptoms : [];
  clean.answers.tether = Array.isArray(value.answers.tether) ? value.answers.tether : [];
  clean.answers.safeguards = { ...clean.answers.safeguards, ...(value.answers.safeguards || {}) };
  clean.answers.anchorDraft = { ...clean.answers.anchorDraft, ...(value.answers.anchorDraft || {}) };
  clean.updatedAt = value.updatedAt || clean.updatedAt;
  return clean;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setError(id, message) {
  const element = document.getElementById(id);
  element.textContent = message;
  element.hidden = !message;
}

function clearFieldError(element) {
  element.classList.remove('is-invalid');
  element.removeAttribute('aria-invalid');
}

function markFieldInvalid(element) {
  element.classList.add('is-invalid');
  element.setAttribute('aria-invalid', 'true');
}

function syncProgressFromInputs() {
  if (!onboardingProgress) onboardingProgress = createProgress(false);
  onboardingProgress.answers.userType = document.querySelector('input[name="user_type"]:checked')?.value || '';
  onboardingProgress.answers.cycle = {
    periodStart: document.getElementById('periodStartDate').value,
    cycleLength: parseInt(document.getElementById('cycleLengthSlider').value, 10),
    lutealLength: parseInt(document.getElementById('lutealLengthSlider').value, 10),
    syncHealth: false
  };
  onboardingProgress.answers.symptoms = [...selectedSymptoms];
  onboardingProgress.answers.tether = tetherContacts.map(contact => ({ ...contact }));
  onboardingProgress.answers.safeguards = {
    safeguard72h: document.getElementById('safeguard72h').checked,
    preferVoiceNotes: document.getElementById('safeguardVoice').checked
  };
  onboardingProgress.answers.anchorDraft = {
    title: document.getElementById('newAnchorTitle').value,
    type: document.getElementById('newAnchorType').value,
    desc: document.getElementById('newAnchorDesc').value
  };
  onboardingProgress.updatedAt = new Date().toISOString();
}

function persistProgress() {
  if (!progressStarted) return;
  syncProgressFromInputs();
  saveOnboardingProgress(onboardingProgress);
}

function applyProgressToInputs() {
  const answers = onboardingProgress.answers;
  document.querySelectorAll('input[name="user_type"]').forEach(radio => {
    radio.checked = radio.value === answers.userType;
  });
  document.getElementById('periodStartDate').value = answers.cycle.periodStart || '';
  document.getElementById('cycleLengthSlider').value = answers.cycle.cycleLength;
  document.getElementById('lutealLengthSlider').value = answers.cycle.lutealLength;
  selectedSymptoms = [...answers.symptoms];
  tetherContacts = answers.tether.map(contact => ({ ...contact }));
  document.getElementById('safeguard72h').checked = answers.safeguards.safeguard72h !== false;
  document.getElementById('safeguardVoice').checked = answers.safeguards.preferVoiceNotes !== false;
  document.getElementById('newAnchorTitle').value = answers.anchorDraft.title || '';
  document.getElementById('newAnchorType').value = answers.anchorDraft.type || 'anchor';
  document.getElementById('newAnchorDesc').value = answers.anchorDraft.desc || '';
  updateRadioStyles(false);
  updateCycleSliders(false);
  loadSymptomChips();
  renderContacts();
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const dateInput = document.getElementById('periodStartDate');
  dateInput.max = localDateString();

  const savedProgress = getOnboardingProgress();
  if (savedProgress) {
    onboardingProgress = normalizeProgress(savedProgress);
    progressStarted = true;
  } else if (params.get('force') === '1' && hasCompletedUserProfile()) {
    onboardingProgress = createProgress(true);
    progressStarted = true;
    saveOnboardingProgress(onboardingProgress);
  } else {
    onboardingProgress = createProgress(false);
  }

  applyProgressToInputs();
  loadSampleAnchors();
  updatePredictedWindows();

  ['periodStartDate', 'cycleLengthSlider', 'lutealLengthSlider', 'safeguard72h', 'safeguardVoice',
    'newAnchorTitle', 'newAnchorType', 'newAnchorDesc'].forEach(id => {
    document.getElementById(id).addEventListener('input', persistProgress);
    document.getElementById(id).addEventListener('change', persistProgress);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeContactModal();
  });

  document.getElementById('resetDemoBtn').hidden = getProfileMeta()?.source !== 'demo';
  goToStep(progressStarted ? onboardingProgress.currentStep : 0, false);
});

function goToStep(step, shouldPersist = true) {
  currentStep = step;
  document.querySelectorAll('main > section').forEach(section => section.style.display = 'none');
  const screen = document.getElementById(step === 0 ? 'screen-welcome' : `screen-step${step}`);
  screen.style.display = step === 0 ? 'flex' : 'block';
  document.getElementById('backBtn').style.display = step > 0 ? 'inline-flex' : 'none';
  document.getElementById('stepCounter').textContent = step === 0 ? 'Welcome' : `Step ${step} of ${totalSteps}`;
  document.getElementById('progressBar').style.width = `${(step / totalSteps) * 100}%`;
  if (shouldPersist) {
    progressStarted = true;
    onboardingProgress.currentStep = step;
    persistProgress();
  }
  window.scrollTo(0, 0);
}

function prevStep() {
  if (currentStep > 0) goToStep(currentStep - 1);
}

function continueExistingProfile() {
  if (hasCompletedUserProfile()) {
    window.location.href = '/index.html';
    return;
  }
  setError('existingProfileMessage', 'No completed LutealShield setup was found on this device. Start setup to create one.');
}

function handleResetDemoData() {
  resetDemoData();
  clearOnboardingProgress();
  window.location.href = '/onboarding.html';
}

function updateRadioStyles(shouldPersist = true) {
  document.querySelectorAll('input[name="user_type"]').forEach(radio => {
    const card = radio.closest('label');
    card.style.borderColor = radio.checked ? 'var(--primary)' : 'var(--border)';
    card.style.backgroundColor = radio.checked ? 'rgba(225, 190, 231, 0.12)' : 'var(--card)';
    radio.removeAttribute('aria-invalid');
  });
  setError('step1Error', '');
  if (shouldPersist) persistProgress();
}

function saveStep1() {
  const selected = document.querySelector('input[name="user_type"]:checked');
  if (!selected) {
    document.querySelectorAll('input[name="user_type"]').forEach(radio => radio.setAttribute('aria-invalid', 'true'));
    setError('step1Error', 'Choose the option that best describes who this shield is for.');
    document.querySelector('input[name="user_type"]').focus();
    return;
  }
  persistProgress();
  goToStep(2);
}

function updateCycleSliders(shouldPersist = true) {
  const cycleLength = document.getElementById('cycleLengthSlider').value;
  const lutealLength = document.getElementById('lutealLengthSlider').value;
  document.getElementById('cycleLengthDisplay').textContent = `${cycleLength} days`;
  document.getElementById('lutealLengthDisplay').textContent = `${lutealLength} days`;
  updatePredictedWindows();
  setError('step2Error', '');
  if (shouldPersist) persistProgress();
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function updatePredictedWindows() {
  const value = document.getElementById('periodStartDate').value;
  const cycleLength = parseInt(document.getElementById('cycleLengthSlider').value, 10);
  const lutealLength = parseInt(document.getElementById('lutealLengthSlider').value, 10);
  if (!isValidDateInput(value)) {
    document.getElementById('predPhase').textContent = 'Add a valid period date';
    document.getElementById('predEarly').textContent = 'Waiting for your date';
    document.getElementById('predRed').textContent = `Days ${cycleLength - 6}-${cycleLength} of cycle`;
    return;
  }
  const start = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.max(1, (Math.floor((today - start) / 86400000) % cycleLength) + 1);
  const ovulationDay = cycleLength - lutealLength;
  const redStart = cycleLength - 6;
  document.getElementById('predPhase').textContent = day >= redStart
    ? 'Late Luteal / Red Zone' : day >= ovulationDay ? 'Early Luteal / Amber Zone' : 'Follicular / Green Zone';
  document.getElementById('predEarly').textContent = day < ovulationDay ? `Starts in ${ovulationDay - day} days` : 'Active or passed this cycle';
  document.getElementById('predRed').textContent = `Days ${redStart}-${cycleLength} of cycle`;
}

function validateStep2() {
  const dateInput = document.getElementById('periodStartDate');
  const value = dateInput.value;
  const cycleLength = parseInt(document.getElementById('cycleLengthSlider').value, 10);
  const lutealLength = parseInt(document.getElementById('lutealLengthSlider').value, 10);
  clearFieldError(dateInput);
  setError('periodStartError', '');
  setError('step2Error', '');
  if (!value || !isValidDateInput(value)) {
    markFieldInvalid(dateInput);
    setError('periodStartError', value ? 'Enter a valid calendar date.' : 'Enter the first day of your most recent period.');
    dateInput.focus();
    return false;
  }
  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate > today) {
    markFieldInvalid(dateInput);
    setError('periodStartError', 'The period start date cannot be in the future.');
    dateInput.focus();
    return false;
  }
  if (cycleLength < 21 || cycleLength > 40) {
    setError('step2Error', 'Cycle length must be between 21 and 40 days.');
    return false;
  }
  if (lutealLength < 10 || lutealLength > 18 || lutealLength >= cycleLength) {
    setError('step2Error', 'Luteal length must be between 10 and 18 days and shorter than the full cycle.');
    return false;
  }
  return true;
}

function saveStep2() {
  if (!validateStep2()) return;
  persistProgress();
  goToStep(3);
}

function loadSymptomChips() {
  Object.entries(PMDD_SYMPTOMS_CATALOG).forEach(([category, symptoms]) => {
    const container = document.getElementById(`chips-${category}`);
    if (!container) return;
    container.replaceChildren();
    symptoms.forEach(symptom => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const selected = selectedSymptoms.includes(symptom);
      chip.className = `symptom-chip ${selected ? 'selected' : ''}`;
      chip.textContent = `${selected ? 'Selected: ' : 'Add: '}${symptom}`;
      chip.setAttribute('aria-pressed', String(selected));
      chip.addEventListener('click', () => {
        if (selectedSymptoms.includes(symptom)) selectedSymptoms = selectedSymptoms.filter(item => item !== symptom);
        else selectedSymptoms.push(symptom);
        setError('step3Error', '');
        loadSymptomChips();
        persistProgress();
      });
      container.appendChild(chip);
    });
  });
}

function saveStep3() {
  if (!selectedSymptoms.length) {
    setError('step3Error', 'Choose at least one symptom to personalize your safety plan.');
    document.querySelector('#chips-emotional button')?.focus();
    return;
  }
  setError('step3Error', '');
  persistProgress();
  goToStep(4);
}

function renderContacts() {
  const container = document.getElementById('contactsContainer');
  container.replaceChildren();
  tetherContacts.forEach((contact, index) => {
    const item = document.createElement('div');
    item.className = 'card';
    item.style.cssText = 'padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;';
    const details = document.createElement('div');
    const name = document.createElement('div');
    name.style.cssText = 'font-weight: 700; font-size: 0.9rem;';
    name.textContent = contact.name;
    const meta = document.createElement('div');
    meta.style.cssText = 'font-size: 0.72rem; color: var(--text-muted);';
    meta.textContent = `${contact.role} · ${contact.method.toUpperCase()} · ${contact.phone}`;
    details.append(name, meta);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-btn';
    remove.setAttribute('aria-label', `Remove ${contact.name}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => removeContact(index));
    item.append(details, remove);
    container.appendChild(item);
  });
  document.getElementById('addContactBtn').style.display = tetherContacts.length >= 3 ? 'none' : 'flex';
}

function addNewContact() {
  if (tetherContacts.length >= 3) return;
  ['contactName', 'contactRole', 'contactPhone'].forEach(id => {
    const field = document.getElementById(id);
    field.value = '';
    clearFieldError(field);
  });
  document.getElementById('contactMethod').value = 'call';
  setError('contactFormError', '');
  document.getElementById('contactModal').classList.add('open');
  setTimeout(() => document.getElementById('contactName').focus(), 0);
}

function closeContactModal() {
  document.getElementById('contactModal').classList.remove('open');
}

function handleContactModalBackdrop(event) {
  if (event.target === event.currentTarget) closeContactModal();
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '');
}

function saveNewContact() {
  const nameField = document.getElementById('contactName');
  const roleField = document.getElementById('contactRole');
  const phoneField = document.getElementById('contactPhone');
  const methodField = document.getElementById('contactMethod');
  const name = nameField.value.trim();
  const role = roleField.value.trim();
  const phone = phoneField.value.trim();
  const digits = normalizePhone(phone);
  [nameField, roleField, phoneField, methodField].forEach(clearFieldError);
  if (!name || !role || digits.length < 7 || digits.length > 15) {
    const invalid = !name ? nameField : !role ? roleField : phoneField;
    markFieldInvalid(invalid);
    setError('contactFormError', !name ? 'Enter the contact’s name.' : !role
      ? 'Enter how this person is connected to you.' : 'Enter a phone number containing 7 to 15 digits.');
    invalid.focus();
    return;
  }
  if (tetherContacts.some(contact => normalizePhone(contact.phone) === digits)) {
    markFieldInvalid(phoneField);
    setError('contactFormError', 'That phone number is already in your trusted circle.');
    phoneField.focus();
    return;
  }
  tetherContacts.push({ id: `${Date.now()}-${tetherContacts.length}`, name, role, phone, method: methodField.value });
  renderContacts();
  persistProgress();
  closeContactModal();
}

function removeContact(index) {
  tetherContacts.splice(index, 1);
  renderContacts();
  persistProgress();
}

function saveStep4() {
  persistProgress();
  goToStep(5);
}

function loadSampleAnchors() {
  const container = document.getElementById('sampleAnchorsList');
  const anchors = hasCompletedUserProfile() && getPocket().length ? getPocket() : STARTER_ANCHORS;
  container.replaceChildren();
  anchors.slice(0, 3).forEach(anchor => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.padding = '12px 14px';
    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 700; font-size: 0.86rem; margin-bottom: 4px;';
    title.textContent = anchor.title;
    const description = document.createElement('p');
    description.style.cssText = 'font-size: 0.78rem; color: var(--text-muted);';
    description.textContent = anchor.desc;
    card.append(title, description);
    container.appendChild(card);
  });
}

function finishOnboarding() {
  const titleField = document.getElementById('newAnchorTitle');
  const descField = document.getElementById('newAnchorDesc');
  const title = titleField.value.trim();
  const desc = descField.value.trim();
  const type = document.getElementById('newAnchorType').value;
  clearFieldError(titleField);
  clearFieldError(descField);
  setError('step5Error', '');

  if (!document.querySelector('input[name="user_type"]:checked')) {
    goToStep(1);
    saveStep1();
    return;
  }
  if (!validateStep2()) {
    goToStep(2);
    return;
  }
  if (!selectedSymptoms.length) {
    goToStep(3);
    setError('step3Error', 'Choose at least one symptom to personalize your safety plan.');
    return;
  }
  if ((title && !desc) || (!title && desc)) {
    const invalid = !title ? titleField : descField;
    markFieldInvalid(invalid);
    setError('step5Error', 'Enter both a title and message for your personal anchor, or leave both blank.');
    invalid.focus();
    return;
  }

  persistProgress();
  const answers = onboardingProgress.answers;
  const existingPocket = hasCompletedUserProfile() ? getPocket() : STARTER_ANCHORS;
  const pocket = existingPocket.map(anchor => ({ ...anchor }));
  if (title && desc) pocket.unshift({ id: `user-${Date.now()}`, title, desc, type, quote: title });

  try {
    saveUserType(answers.userType);
    saveCycle({ ...answers.cycle, syncHealth: false });
    saveSymptoms([...answers.symptoms]);
    saveTether(answers.tether.map(contact => ({ ...contact })));
    saveSettings({ ...getSettings(), safeguard72h: answers.safeguards.safeguard72h, preferVoiceNotes: answers.safeguards.preferVoiceNotes });
    savePocket(pocket);
    completeOnboarding();
    clearOnboardingProgress();
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Unable to complete onboarding', error);
    setError('step5Error', 'Your setup could not be saved on this device. Your draft is still available; please try again.');
  }
}

Object.assign(window, {
  goToStep,
  prevStep,
  continueExistingProfile,
  handleResetDemoData,
  updateRadioStyles,
  saveStep1,
  updateCycleSliders,
  saveStep2,
  saveStep3,
  addNewContact,
  closeContactModal,
  handleContactModalBackdrop,
  saveNewContact,
  saveStep4,
  finishOnboarding
});

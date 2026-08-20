const modal = document.getElementById('bookingModal');
const form = document.getElementById('bookingForm');
const formError = document.getElementById('formError');
const formView = document.getElementById('modalFormView');
const resultView = document.getElementById('modalResultView');
const submitBtn = document.getElementById('submitBooking');

const sosireInput = document.getElementById('sosire');
const plecareInput = document.getElementById('plecare');

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function resetDates() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  sosireInput.value = toDateInputValue(today);
  plecareInput.value = toDateInputValue(tomorrow);
}

function openModal() {
  formView.hidden = false;
  resultView.hidden = true;
  formError.hidden = true;
  form.reset();
  resetDates();
  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
}

document.getElementById('openBookingModal').addEventListener('click', openModal);
document.getElementById('closeBookingModal').addEventListener('click', closeModal);
document.getElementById('cancelBooking').addEventListener('click', closeModal);
document.getElementById('closeResult').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

const STATUS_LABEL = {
  SENT: 'Trimis',
  SKIPPED: 'Omis',
  FAILED: 'Eșuat',
};

function showResult({ success, title, subtitle, results }) {
  formView.hidden = true;
  resultView.hidden = false;

  const icon = document.getElementById('resultIcon');
  icon.className = `result-icon ${success ? 'success' : 'error'}`;
  icon.textContent = success ? '✓' : '!';

  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultSub').textContent = subtitle;

  const list = document.getElementById('resultList');
  list.innerHTML = '';
  (results || []).forEach((r) => {
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = `status-dot ${r.status}`;
    const label = document.createElement('span');
    label.textContent = `${r.channel} → ${r.recipient}: ${STATUS_LABEL[r.status] || r.status}${r.detail ? ` (${r.detail})` : ''}`;
    li.append(dot, label);
    list.appendChild(li);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const payload = {
    name: document.getElementById('nume').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('telefon').value.trim() || undefined,
    checkIn: sosireInput.value,
    checkOut: plecareInput.value,
    numberOfGuests: Number(document.getElementById('oaspeti').value),
    notes: document.getElementById('observatii').value.trim() || undefined,
  };

  if (new Date(payload.checkOut) <= new Date(payload.checkIn)) {
    formError.textContent = 'Data de plecare trebuie să fie după data de sosire.';
    formError.hidden = false;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Se trimite...';

  try {
    const res = await fetch('/api/booking-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showResult({
        success: false,
        title: 'Solicitarea nu a putut fi trimisă',
        subtitle: data.error || 'A apărut o eroare neașteptată.',
        results: [],
      });
      return;
    }

    showResult({
      success: true,
      title: 'Solicitare trimisă!',
      subtitle: `Referință rezervare: ${data.bookingReference}`,
      results: data.results,
    });
  } catch (err) {
    showResult({
      success: false,
      title: 'Solicitarea nu a putut fi trimisă',
      subtitle: 'Nu am putut contacta serverul. Încearcă din nou.',
      results: [],
    });
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Trimite solicitarea';
  }
});

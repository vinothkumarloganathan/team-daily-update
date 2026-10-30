const STORAGE_KEY = 'teamDailyUpdates';
const defaultFormValues = {
  date: new Date().toISOString().slice(0, 10),
  member: '',
  project: '',
  status: 'On Track',
  workDone: '',
  blockers: '',
  nextSteps: '',
  hours: '',
  priority: 'Medium',
};

let updates = loadUpdates();
let editingId = null;

const form = document.getElementById('dailyForm');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const fileInput = document.getElementById('excelFileInput');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const resetBtn = document.getElementById('resetBtn');

function loadUpdates() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Unable to parse stored updates', error);
    return [];
  }
}

function saveUpdates() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
}

function populateFormDefaults() {
  document.getElementById('date').value = defaultFormValues.date;
  document.getElementById('member').value = defaultFormValues.member;
  document.getElementById('project').value = defaultFormValues.project;
  document.getElementById('status').value = defaultFormValues.status;
  document.getElementById('workDone').value = defaultFormValues.workDone;
  document.getElementById('blockers').value = defaultFormValues.blockers;
  document.getElementById('nextSteps').value = defaultFormValues.nextSteps;
  document.getElementById('hours').value = defaultFormValues.hours;
  document.getElementById('priority').value = defaultFormValues.priority;
}

function getFormValues() {
  return {
    date: document.getElementById('date').value,
    member: document.getElementById('member').value.trim(),
    project: document.getElementById('project').value.trim(),
    status: document.getElementById('status').value,
    workDone: document.getElementById('workDone').value.trim(),
    blockers: document.getElementById('blockers').value.trim(),
    nextSteps: document.getElementById('nextSteps').value.trim(),
    hours: document.getElementById('hours').value,
    priority: document.getElementById('priority').value,
  };
}

function setFormValues(update) {
  document.getElementById('date').value = update.date || defaultFormValues.date;
  document.getElementById('member').value = update.member || '';
  document.getElementById('project').value = update.project || '';
  document.getElementById('status').value = update.status || 'On Track';
  document.getElementById('workDone').value = update.workDone || '';
  document.getElementById('blockers').value = update.blockers || '';
  document.getElementById('nextSteps').value = update.nextSteps || '';
  document.getElementById('hours').value = update.hours || '';
  document.getElementById('priority').value = update.priority || 'Medium';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function getStatusClass(status) {
  return `status-${status}`;
}

function getFilteredUpdates() {
  const query = searchInput.value.trim().toLowerCase();
  const filterStatus = statusFilter.value;

  return updates.filter((item) => {
    const matchesSearch =
      !query ||
      item.member?.toLowerCase().includes(query) ||
      item.project?.toLowerCase().includes(query) ||
      item.workDone?.toLowerCase().includes(query);

    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
}

function renderTable() {
  const filteredUpdates = getFilteredUpdates();

  if (!filteredUpdates.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No daily updates found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredUpdates
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (item) => `
        <tr>
          <td>${formatDate(item.date)}</td>
          <td>${item.member || '-'}</td>
          <td>${item.project || '-'}</td>
          <td><span class="status-badge ${getStatusClass(item.status)}">${item.status || 'On Track'}</span></td>
          <td><span class="priority-pill">${item.priority || 'Medium'}</span></td>
          <td>${item.hours || '0'}</td>
          <td>
            <div class="action-group">
              <button class="action-btn edit" data-id="${item.id}">Edit</button>
              <button class="action-btn delete" data-id="${item.id}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

function resetForm() {
  editingId = null;
  populateFormDefaults();
  form.querySelector('button[type="submit"]').textContent = 'Save Update';
}

function addOrUpdateUpdate(event) {
  event.preventDefault();

  const values = getFormValues();

  if (!values.member || !values.project || !values.date) {
    alert('Please fill in date, team member, and project.');
    return;
  }

  if (editingId !== null) {
    updates = updates.map((item) => (item.id === editingId ? { ...item, ...values } : item));
  } else {
    const newEntry = {
      id: Date.now().toString(),
      ...values,
    };
    updates.unshift(newEntry);
  }

  saveUpdates();
  renderTable();
  resetForm();
}

function handleTableActions(event) {
  const target = event.target;
  if (!target.classList.contains('action-btn')) return;

  const id = target.dataset.id;
  const row = updates.find((item) => item.id === id);

  if (!row) return;

  if (target.classList.contains('edit')) {
    editingId = id;
    setFormValues(row);
    form.querySelector('button[type="submit"]').textContent = 'Update Entry';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (target.classList.contains('delete')) {
    const confirmed = window.confirm(`Delete the update for ${row.member} on ${formatDate(row.date)}?`);
    if (!confirmed) return;

    updates = updates.filter((item) => item.id !== id);
    saveUpdates();
    renderTable();

    if (editingId === id) {
      resetForm();
    }
  }
}

function toExcelWorkbook(data) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      Date: item.date,
      Member: item.member,
      Project: item.project,
      Status: item.status,
      WorkDone: item.workDone,
      Blockers: item.blockers,
      NextSteps: item.nextSteps,
      Hours: item.hours,
      Priority: item.priority,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DailyUpdates');
  return workbook;
}

function exportToExcel() {
  const workbook = toExcelWorkbook(updates);
  XLSX.writeFile(workbook, 'team_daily_updates.xlsx');
}

function importFromExcel(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows.length) {
        alert('The selected Excel file does not contain any rows.');
        return;
      }

      const normalizedRows = rows.map((row, index) => ({
        id: (row.id && String(row.id)) || `excel-${Date.now()}-${index}`,
        date: row.Date || row.date || '',
        member: row.Member || row.member || '',
        project: row.Project || row.project || '',
        status: row.Status || row.status || 'On Track',
        workDone: row.WorkDone || row.workDone || '',
        blockers: row.Blockers || row.blockers || '',
        nextSteps: row.NextSteps || row.nextSteps || '',
        hours: row.Hours || row.hours || '',
        priority: row.Priority || row.priority || 'Medium',
      }));

      updates = [...normalizedRows, ...updates];
      saveUpdates();
      renderTable();
      alert('Excel data imported successfully.');
    } catch (error) {
      console.error(error);
      alert('Unable to read the selected Excel file. Please check the format.');
    } finally {
      fileInput.value = '';
    }
  };

  reader.readAsArrayBuffer(file);
}

form.addEventListener('submit', addOrUpdateUpdate);
resetBtn.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderTable);
statusFilter.addEventListener('change', renderTable);
tableBody.addEventListener('click', handleTableActions);
exportBtn.addEventListener('click', exportToExcel);
importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', importFromExcel);

populateFormDefaults();
renderTable();

// Initialize PDF.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application State
let state = {
  bankQuestions: [],
  paperMeta: {
    school: "Apex Academy of Sciences",
    exam: "Terminal Examination 2026",
    subject: "General Science & Mathematics",
    grade: "Class X",
    time: "3 Hours",
    targetMarks: 100,
    instructions: [
      "All questions are compulsory.",
      "Section A contains Multiple Choice Questions (1 mark each).",
      "Section B contains Short Answer Questions (3 marks each).",
      "Section C contains Long Answer Questions (5 marks each).",
      "Use of calculator is not permitted. Write clean and legible steps."
    ]
  },
  paperSections: [
    {
      id: "sec-default-1",
      title: "Section A - Multiple Choice Questions",
      questionIds: []
    },
    {
      id: "sec-default-2",
      title: "Section B - Short Answers",
      questionIds: []
    }
  ],
  theme: "dark",
  apiKey: ""
};

// Drag & Drop State
let draggedQuestionId = null;
let draggedSectionId = null;
let dragSource = null; // 'bank' or 'section'

// DOM Elements & Initializers
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  setupEventListeners();
  populateFilters();
  renderQuestionBank();
  renderPaperCanvas();
  renderStats();
  renderBookExplorer();
  
  // Create icons
  lucide.createIcons();
});

// Load & Save State to LocalStorage
function loadState() {
  const savedApiKey = localStorage.getItem('aura_gemini_key');
  if (savedApiKey) {
    state.apiKey = savedApiKey;
    const keyInput = document.getElementById('gemini-key-input');
    const modalKeyInput = document.getElementById('gemini-modal-input');
    if (keyInput) keyInput.value = savedApiKey;
    if (modalKeyInput) modalKeyInput.value = savedApiKey;
    updateKeyStatus(true);
  }

  const savedTheme = localStorage.getItem('aura_theme');
  if (savedTheme) {
    state.theme = savedTheme;
  }

  const savedBank = localStorage.getItem('aura_question_bank');
  if (savedBank) {
    try {
      state.bankQuestions = JSON.parse(savedBank);
    } catch(e) {
      state.bankQuestions = [];
    }
  } else {
    state.bankQuestions = [];
  }

  const savedMeta = localStorage.getItem('aura_paper_meta');
  if (savedMeta) {
    try {
      state.paperMeta = JSON.parse(savedMeta);
    } catch(e) {}
  }

  const savedSections = localStorage.getItem('aura_paper_sections');
  if (savedSections) {
    try {
      state.paperSections = JSON.parse(savedSections);
    } catch(e) {}
  }

  const savedBook = localStorage.getItem('aura_uploaded_book');
  if (savedBook) {
    try {
      state.uploadedBook = JSON.parse(savedBook);
    } catch(e) {}
  }

  const savedChapters = localStorage.getItem('aura_chapters');
  if (savedChapters) {
    try {
      state.chapters = JSON.parse(savedChapters);
    } catch(e) {}
  }

  // Populate Meta Inputs
  document.getElementById('meta-school').value = state.paperMeta.school;
  document.getElementById('meta-exam').value = state.paperMeta.exam;
  document.getElementById('meta-subject').value = state.paperMeta.subject;
  document.getElementById('meta-class').value = state.paperMeta.grade;
  document.getElementById('meta-time').value = state.paperMeta.time;
  document.getElementById('meta-marks').value = state.paperMeta.targetMarks;
  document.getElementById('meta-instructions').value = state.paperMeta.instructions.join('\n');
}

function saveState() {
  localStorage.setItem('aura_theme', state.theme);
  localStorage.setItem('aura_question_bank', JSON.stringify(state.bankQuestions));
  localStorage.setItem('aura_paper_meta', JSON.stringify(state.paperMeta));
  localStorage.setItem('aura_paper_sections', JSON.stringify(state.paperSections));
  
  if (state.uploadedBook) {
    localStorage.setItem('aura_uploaded_book', JSON.stringify(state.uploadedBook));
  } else {
    localStorage.removeItem('aura_uploaded_book');
  }
  if (state.chapters) {
    localStorage.setItem('aura_chapters', JSON.stringify(state.chapters));
  } else {
    localStorage.removeItem('aura_chapters');
  }
}

// UI Initialization
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('theme-toggle');
  if (state.theme === 'dark') {
    themeBtn.innerHTML = '<i data-lucide="sun"></i>';
  } else {
    themeBtn.innerHTML = '<i data-lucide="moon"></i>';
  }
}

function setupEventListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Filters
  document.getElementById('search-input').addEventListener('input', renderQuestionBank);
  document.getElementById('filter-subject').addEventListener('change', renderQuestionBank);
  document.getElementById('filter-difficulty').addEventListener('change', renderQuestionBank);
  document.getElementById('filter-type').addEventListener('change', renderQuestionBank);

  // Clear Bank
  document.getElementById('btn-clear-bank').addEventListener('click', clearBank);

  // Clear Canvas
  document.getElementById('btn-clear-canvas').addEventListener('click', clearCanvas);

  // Add Section Button
  document.getElementById('btn-add-section').addEventListener('click', addNewSection);

  // Save Meta Inputs dynamically
  const metaInputs = ['meta-school', 'meta-exam', 'meta-subject', 'meta-class', 'meta-time', 'meta-marks'];
  metaInputs.forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      const prop = id.replace('meta-', '');
      const key = prop === 'class' ? 'grade' : prop === 'marks' ? 'targetMarks' : prop;
      state.paperMeta[key] = e.target.value;
      if (key === 'targetMarks') {
        renderStats();
      }
      saveState();
      
      // Update page headers dynamically
      if (id === 'meta-exam') {
        document.getElementById('paper-main-title').textContent = e.target.value || 'New Question Paper';
      }
    });
  });

  document.getElementById('meta-instructions').addEventListener('input', (e) => {
    state.paperMeta.instructions = e.target.value.split('\n').filter(i => i.trim() !== '');
    saveState();
  });

  // API Key actions
  document.getElementById('save-key-btn').addEventListener('click', () => {
    const key = document.getElementById('gemini-key-input').value.trim();
    saveApiKey(key);
  });
  
  document.getElementById('modal-save-key-btn').addEventListener('click', () => {
    const key = document.getElementById('gemini-modal-input').value.trim();
    saveApiKey(key);
    closeModal('api-modal-overlay');
  });

  // Upload actions
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleBookUpload(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleBookUpload(e.target.files[0]);
    }
  });

  // Book chapters actions
  document.getElementById('btn-close-book').addEventListener('click', () => {
    if (confirm("Are you sure you want to unload this book? Chapters list will be cleared.")) {
      state.uploadedBook = null;
      state.chapters = [];
      window.currentBookArrayBuffer = null;
      window.currentPdfDoc = null;
      saveState();
      renderBookExplorer();
      showToast("Book unloaded.", "warning");
    }
  });
  document.getElementById('btn-add-chapter').addEventListener('click', () => openChapterEditModal());
  document.getElementById('btn-save-chapter').addEventListener('click', saveChapter);
  document.getElementById('btn-trigger-chapter-gen').addEventListener('click', triggerChapterQuestionGeneration);

  // Modal Save Question
  document.getElementById('modal-save-q-btn').addEventListener('click', saveQuestionFromModal);

  // Type change inside modal (toggle option inputs)
  document.getElementById('q-modal-type').addEventListener('change', (e) => {
    const wrapper = document.getElementById('q-modal-options-wrapper');
    if (e.target.value === 'mcq') {
      wrapper.style.display = 'flex';
    } else {
      wrapper.style.display = 'none';
    }
  });

  // Auto generate action
  document.getElementById('btn-auto-generate').addEventListener('click', () => {
    // Populate auto generate subjects dropdown
    const subjects = [...new Set(state.bankQuestions.map(q => q.subject))].filter(Boolean);
    const select = document.getElementById('gen-subject');
    select.innerHTML = '<option value="">Any Subject / All</option>';
    subjects.forEach(sub => {
      select.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
    
    // Preset target marks matching meta target
    document.getElementById('gen-total-marks').value = state.paperMeta.targetMarks;
    openModal('auto-gen-modal-overlay');
  });

  document.getElementById('btn-trigger-auto-gen').addEventListener('click', triggerAutoGeneration);

  // Backup / Restore Modal actions
  document.getElementById('btn-backup-restore').addEventListener('click', () => {
    openModal('backup-modal-overlay');
  });

  document.getElementById('btn-export-backup').addEventListener('click', exportBackupJSON);

  document.getElementById('restore-file-input').addEventListener('change', importBackupJSON);

  // Custom question add action
  document.getElementById('btn-add-custom-q').addEventListener('click', () => {
    openQuestionModal();
  });

  // Preview paper panel triggers
  document.getElementById('btn-preview-paper').addEventListener('click', openPrintPreview);
  document.getElementById('btn-close-preview').addEventListener('click', closePrintPreview);
  document.getElementById('btn-trigger-print').addEventListener('click', () => window.print());
  document.getElementById('btn-export-word').addEventListener('click', exportWordDocument);

  // Print settings triggers
  document.getElementById('print-setting-font').addEventListener('change', applyPrintStyles);
  document.getElementById('print-setting-size').addEventListener('change', applyPrintStyles);
  document.getElementById('print-setting-spacing').addEventListener('change', applyPrintStyles);
  document.getElementById('print-setting-margin').addEventListener('change', applyPrintStyles);
  document.getElementById('print-toggle-answers').addEventListener('change', renderPrintPreviewCanvas);
  document.getElementById('print-toggle-marks').addEventListener('change', renderPrintPreviewCanvas);

  // Responsive UI Event Listeners
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const mobileMenuBtn = document.getElementById('btn-mobile-menu');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        // Mobile close behavior
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
      } else {
        // Desktop collapse behavior
        sidebar.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('i');
        if (icon) {
          if (sidebar.classList.contains('collapsed')) {
            icon.setAttribute('data-lucide', 'chevron-right');
          } else {
            icon.setAttribute('data-lucide', 'chevron-left');
          }
          lucide.createIcons();
        }
      }
    });
  }

  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Workspace View Switcher Tabs (Mobile/Tablet)
  const wrapper = document.querySelector('.workspace-wrapper');
  if (wrapper) {
    wrapper.setAttribute('data-active-tab', 'bank'); // Default selection
  }

  const tabBtns = document.querySelectorAll('.workspace-tab');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      if (wrapper) {
        wrapper.setAttribute('data-active-tab', tabName);
      }
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Close sidebar drawer if open when switching tabs
      if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
      }
    });
  });
}

// Save Key Helper
function saveApiKey(key) {
  if (key) {
    state.apiKey = key;
    localStorage.setItem('aura_gemini_key', key);
    document.getElementById('gemini-key-input').value = key;
    document.getElementById('gemini-modal-input').value = key;
    updateKeyStatus(true);
    showToast("Gemini API Key successfully saved!", "success");
  } else {
    state.apiKey = "";
    localStorage.removeItem('aura_gemini_key');
    document.getElementById('gemini-key-input').value = "";
    document.getElementById('gemini-modal-input').value = "";
    updateKeyStatus(false);
    showToast("Gemini API Key cleared.", "warning");
  }
}

function updateKeyStatus(hasKey) {
  const statusEl = document.getElementById('key-status-text');
  const btn = document.getElementById('save-key-btn');
  if (hasKey) {
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--success)';
    statusEl.textContent = 'Active (Gemini AI Enabled)';
    btn.classList.add('success');
    btn.innerHTML = '<i data-lucide="check-circle-2"></i>';
  } else {
    statusEl.style.display = 'none';
    btn.classList.remove('success');
    btn.innerHTML = '<i data-lucide="key"></i>';
  }
  lucide.createIcons();
}

// Theme Toggle Helper
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  initTheme();
  saveState();
  lucide.createIcons();
}

// Dropdown filter population
function populateFilters() {
  const subjects = [...new Set(state.bankQuestions.map(q => q.subject))].filter(Boolean);
  const filter = document.getElementById('filter-subject');
  
  // Retain the default "All Subjects" option
  filter.innerHTML = '<option value="">All Subjects</option>';
  subjects.forEach(subject => {
    filter.innerHTML += `<option value="${subject}">${subject}</option>`;
  });
}

// Modal helper controls
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Question edit/create modal orchestration
function openQuestionModal(qId = null) {
  const modalTitle = document.getElementById('q-modal-title');
  const idInput = document.getElementById('q-edit-id');
  const textInput = document.getElementById('q-modal-text');
  const typeSelect = document.getElementById('q-modal-type');
  const answerInput = document.getElementById('q-modal-answer');
  const subjectInput = document.getElementById('q-modal-subject');
  const topicInput = document.getElementById('q-modal-topic');
  const diffSelect = document.getElementById('q-modal-difficulty');
  const marksInput = document.getElementById('q-modal-marks');
  const optionsWrapper = document.getElementById('q-modal-options-wrapper');

  // Reset inputs
  idInput.value = "";
  textInput.value = "";
  typeSelect.value = "mcq";
  optionsWrapper.style.display = "flex";
  document.getElementById('q-opt-a').value = "";
  document.getElementById('q-opt-b').value = "";
  document.getElementById('q-opt-c').value = "";
  document.getElementById('q-opt-d').value = "";
  answerInput.value = "";
  subjectInput.value = state.paperMeta.subject || "General";
  topicInput.value = "General";
  diffSelect.value = "medium";
  marksInput.value = "2";

  if (qId) {
    modalTitle.textContent = "Edit Question";
    const q = state.bankQuestions.find(item => item.id === qId);
    if (q) {
      idInput.value = q.id;
      textInput.value = q.question;
      typeSelect.value = q.type;
      answerInput.value = q.answer || "";
      subjectInput.value = q.subject;
      topicInput.value = q.topic;
      diffSelect.value = q.difficulty;
      marksInput.value = q.marks;

      if (q.type === 'mcq' && q.options) {
        optionsWrapper.style.display = "flex";
        document.getElementById('q-opt-a').value = q.options[0] || "";
        document.getElementById('q-opt-b').value = q.options[1] || "";
        document.getElementById('q-opt-c').value = q.options[2] || "";
        document.getElementById('q-opt-d').value = q.options[3] || "";
      } else {
        optionsWrapper.style.display = "none";
      }
    }
  } else {
    modalTitle.textContent = "Add Custom Question";
  }

  openModal('q-modal-overlay');
}

function saveQuestionFromModal() {
  const id = document.getElementById('q-edit-id').value;
  const question = document.getElementById('q-modal-text').value.trim();
  const type = document.getElementById('q-modal-type').value;
  const answer = document.getElementById('q-modal-answer').value.trim();
  const subject = document.getElementById('q-modal-subject').value.trim() || "General";
  const topic = document.getElementById('q-modal-topic').value.trim() || "General";
  const difficulty = document.getElementById('q-modal-difficulty').value;
  const marks = parseInt(document.getElementById('q-modal-marks').value) || 1;

  if (!question) {
    showToast("Please enter a question prompt.", "error");
    return;
  }

  let options = null;
  if (type === 'mcq') {
    const a = document.getElementById('q-opt-a').value.trim();
    const b = document.getElementById('q-opt-b').value.trim();
    const c = document.getElementById('q-opt-c').value.trim();
    const d = document.getElementById('q-opt-d').value.trim();
    
    if (!a || !b) {
      showToast("MCQs require at least Option A and Option B.", "error");
      return;
    }
    options = [a, b];
    if (c) options.push(c);
    if (d) options.push(d);
  }

  if (id) {
    // Edit existing
    const idx = state.bankQuestions.findIndex(q => q.id === id);
    if (idx !== -1) {
      state.bankQuestions[idx] = { ...state.bankQuestions[idx], question, type, options, answer, subject, topic, difficulty, marks };
      showToast("Question updated!", "success");
    }
  } else {
    // Create new
    const newQ = {
      id: 'custom-' + Date.now(),
      question, type, options, answer, subject, topic, difficulty, marks
    };
    state.bankQuestions.unshift(newQ);
    showToast("Question added to bank!", "success");
  }

  closeModal('q-modal-overlay');
  populateFilters();
  renderQuestionBank();
  renderPaperCanvas();
  renderStats();
  saveState();
}

// Clear bank helper
function clearBank() {
  if (confirm("Are you sure you want to clear all questions in the Question Bank?")) {
    state.bankQuestions = [];
    populateFilters();
    renderQuestionBank();
    renderPaperCanvas();
    renderStats();
    saveState();
    showToast("Question Bank cleared.", "warning");
  }
}

// Clear Canvas
function clearCanvas() {
  if (confirm("Are you sure you want to remove all questions and sections from the current Question Paper canvas?")) {
    state.paperSections = [];
    renderPaperCanvas();
    renderStats();
    saveState();
    showToast("Canvas cleared.", "success");
  }
}

// Section Management
function addNewSection() {
  const sectionNum = state.paperSections.length + 1;
  const newSection = {
    id: 'sec-' + Date.now(),
    title: `Section ${String.fromCharCode(64 + sectionNum)} - Part ${sectionNum}`,
    questionIds: []
  };
  state.paperSections.push(newSection);
  renderPaperCanvas();
  saveState();
  showToast("New section added.", "success");
}

function removeSection(secId) {
  if (confirm("Are you sure you want to delete this section? Included questions will be returned to the bank.")) {
    state.paperSections = state.paperSections.filter(sec => sec.id !== secId);
    renderPaperCanvas();
    renderStats();
    saveState();
    showToast("Section removed.", "warning");
  }
}

function updateSectionTitle(secId, title) {
  const sec = state.paperSections.find(s => s.id === secId);
  if (sec) {
    sec.title = title;
    saveState();
  }
}

function removeQuestionFromSection(secId, qId) {
  const sec = state.paperSections.find(s => s.id === secId);
  if (sec) {
    sec.questionIds = sec.questionIds.filter(id => id !== qId);
    renderPaperCanvas();
    renderStats();
    saveState();
  }
}

// Question Bank rendering with filter sorting
function renderQuestionBank() {
  const searchVal = document.getElementById('search-input').value.toLowerCase();
  const subVal = document.getElementById('filter-subject').value;
  const diffVal = document.getElementById('filter-difficulty').value;
  const typeVal = document.getElementById('filter-type').value;

  const container = document.getElementById('bank-question-list');
  container.innerHTML = "";

  // Filter bankQuestions
  const filtered = state.bankQuestions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchVal) || q.topic.toLowerCase().includes(searchVal);
    const matchesSub = !subVal || q.subject === subVal;
    const matchesDiff = !diffVal || q.difficulty === diffVal;
    const matchesType = !typeVal || q.type === typeVal;
    return matchesSearch && matchesSub && matchesDiff && matchesType;
  });

  document.getElementById('bank-count-badge').textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <i data-lucide="help-circle" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto;"></i>
        No questions matched your filters.
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(q => {
    const card = document.createElement('div');
    card.className = "question-card";
    card.draggable = true;
    card.dataset.id = q.id;

    // Badges UI
    const badgesHtml = `
      <div class="question-card-meta">
        <span class="badge badge-subject">${q.subject}</span>
        <span class="badge badge-topic">${q.topic}</span>
        <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
        <span class="badge badge-marks">${q.marks} Mark${q.marks > 1 ? 's' : ''}</span>
      </div>
    `;

    // MCQ choices rendering
    let optionsHtml = "";
    if (q.type === 'mcq' && q.options) {
      optionsHtml = `<ul class="question-options-list">`;
      q.options.forEach((opt, idx) => {
        optionsHtml += `
          <li class="question-option">
            <span class="question-option-letter">${String.fromCharCode(65 + idx)}.</span>
            <span>${opt}</span>
          </li>
        `;
      });
      optionsHtml += `</ul>`;
    }

    card.innerHTML = `
      ${badgesHtml}
      <div class="question-card-text">${q.question}</div>
      ${optionsHtml}
      <div class="question-card-footer">
        <div class="answer-key-preview" title="Correct Answer">
          <i data-lucide="key-round" style="width: 12px; height: 12px;"></i>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">${q.answer || 'No answer set'}</span>
        </div>
        <div class="question-actions">
          <button class="btn-card btn-card-edit" onclick="openQuestionModal('${q.id}')" title="Edit Question">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-card btn-card-delete" onclick="deleteQuestion('${q.id}')" title="Delete Question">
            <i data-lucide="trash-2"></i>
          </button>
          
          <!-- Dropdown button to add to sections directly -->
          <button class="btn-card btn-card-add" onclick="showAddToSectionPopover(event, '${q.id}')" title="Add to Paper Section">
            <i data-lucide="plus-circle"></i>
          </button>
        </div>
      </div>
    `;

    // Setup drag events
    card.addEventListener('dragstart', (e) => {
      draggedQuestionId = q.id;
      dragSource = 'bank';
      card.style.opacity = '0.5';
    });

    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });

    container.appendChild(card);
  });

  lucide.createIcons();
}

// Direct action add popover
function showAddToSectionPopover(e, qId) {
  e.stopPropagation();
  
  if (state.paperSections.length === 0) {
    showToast("Please add a Section to your paper first.", "warning");
    return;
  }

  // Remove existing popovers if any
  const oldPop = document.querySelector('.section-popover');
  if (oldPop) oldPop.remove();

  const popover = document.createElement('div');
  popover.className = "section-popover";
  popover.style.position = 'fixed';
  popover.style.left = `${e.clientX}px`;
  popover.style.top = `${e.clientY}px`;
  popover.style.backgroundColor = 'var(--bg-card)';
  popover.style.border = '1px solid var(--border-color)';
  popover.style.borderRadius = '8px';
  popover.style.boxShadow = 'var(--shadow-lg)';
  popover.style.padding = '0.5rem';
  popover.style.zIndex = '999';
  popover.style.display = 'flex';
  popover.style.flexDirection = 'column';
  popover.style.gap = '0.25rem';

  state.paperSections.forEach((sec, idx) => {
    const item = document.createElement('button');
    item.style.background = 'none';
    item.style.border = 'none';
    item.style.padding = '0.5rem 1rem';
    item.style.fontSize = '0.8125rem';
    item.style.textAlign = 'left';
    item.style.cursor = 'pointer';
    item.style.color = 'var(--text-main)';
    item.style.borderRadius = '4px';
    item.textContent = sec.title || `Section ${idx+1}`;
    
    item.addEventListener('mouseenter', () => item.style.backgroundColor = 'var(--bg-card-hover)');
    item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');
    
    item.addEventListener('click', () => {
      addQuestionToSection(sec.id, qId);
      popover.remove();
    });
    
    popover.appendChild(item);
  });

  document.body.appendChild(popover);

  // Close when clicking outside
  const closePop = (ev) => {
    if (!popover.contains(ev.target)) {
      popover.remove();
      document.removeEventListener('click', closePop);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closePop);
  }, 10);
}

// Add question helper
function addQuestionToSection(secId, qId) {
  const sec = state.paperSections.find(s => s.id === secId);
  if (sec) {
    if (sec.questionIds.includes(qId)) {
      showToast("Question is already in this section.", "warning");
      return;
    }
    sec.questionIds.push(qId);
    renderPaperCanvas();
    renderStats();
    saveState();
    showToast(`Added question to ${sec.title}`, "success");
  }
}

// Delete question completely
function deleteQuestion(qId) {
  if (confirm("Are you sure you want to delete this question? It will be removed from the bank and any section containing it.")) {
    state.bankQuestions = state.bankQuestions.filter(q => q.id !== qId);
    state.paperSections.forEach(sec => {
      sec.questionIds = sec.questionIds.filter(id => id !== qId);
    });
    populateFilters();
    renderQuestionBank();
    renderPaperCanvas();
    renderStats();
    saveState();
    showToast("Question deleted.", "warning");
  }
}

// Canvas Editor UI updates
function renderPaperCanvas() {
  const container = document.getElementById('paper-sections-container');
  container.innerHTML = "";

  if (state.paperSections.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); border: 2px dashed var(--border-color); border-radius: 10px; margin-bottom: 1.5rem;">
        <i data-lucide="file-edit" style="font-size: 2.5rem; color: var(--border-color); margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto;"></i>
        <h4 style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 0.25rem;">Start building your paper</h4>
        <p style="font-size: 0.8125rem;">Add a new section, then drag questions from the Question Bank into it.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  state.paperSections.forEach((sec, secIdx) => {
    const secEl = document.createElement('div');
    secEl.className = "paper-section";
    secEl.dataset.id = sec.id;

    // Header controls
    secEl.innerHTML = `
      <div class="section-header">
        <div class="section-title-container">
          <i data-lucide="grip-vertical" class="section-drag-handle" title="Drag to reorder section"></i>
          <input type="text" value="${sec.title}" onchange="updateSectionTitle('${sec.id}', this.value)" placeholder="e.g. Section A: Multiple Choice Questions">
        </div>
        <div class="section-actions">
          <button class="btn-card btn-card-delete" onclick="removeSection('${sec.id}')" title="Delete Section">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div class="section-questions-list" id="q-list-${sec.id}">
        <!-- Render questions in section -->
      </div>
    `;

    // Render questions list inside section
    const qListEl = secEl.querySelector('.section-questions-list');
    
    if (sec.questionIds.length === 0) {
      qListEl.innerHTML = `
        <div class="empty-section-placeholder">
          <i data-lucide="download-cloud"></i>
          <span>Drag questions here</span>
        </div>
      `;
    } else {
      sec.questionIds.forEach((qId, qIdx) => {
        const q = state.bankQuestions.find(item => item.id === qId);
        if (!q) return; // safeguard

        const qItem = document.createElement('div');
        qItem.className = "paper-question-item";
        qItem.draggable = true;
        qItem.dataset.id = qId;
        qItem.dataset.secId = sec.id;

        qItem.innerHTML = `
          <div class="paper-question-number">${qIdx + 1}.</div>
          <div class="paper-question-content">
            <div class="paper-question-text">${q.question}</div>
            
            ${q.type === 'mcq' && q.options ? `
              <div class="print-q-opts" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.25rem; font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.25rem;">
                ${q.options.map((opt, oIdx) => `<div>${String.fromCharCode(65 + oIdx)}. ${opt}</div>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="paper-question-actions">
            <span class="badge badge-marks">${q.marks} M</span>
            <button class="btn-card" onclick="removeQuestionFromSection('${sec.id}', '${qId}')" title="Remove question from paper" style="color: var(--danger);">
              <i data-lucide="x"></i>
            </button>
          </div>
        `;

        // Question drag ordering within canvas
        qItem.addEventListener('dragstart', (e) => {
          draggedQuestionId = qId;
          draggedSectionId = sec.id;
          dragSource = 'canvas';
          qItem.style.opacity = '0.4';
        });

        qItem.addEventListener('dragend', () => {
          qItem.style.opacity = '1';
        });

        qListEl.appendChild(qItem);
      });
    }

    // Drag-over handlers for section as a drop container
    qListEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      secEl.classList.add('dragover');
    });

    qListEl.addEventListener('dragleave', () => {
      secEl.classList.remove('dragover');
    });

    qListEl.addEventListener('drop', (e) => {
      e.preventDefault();
      secEl.classList.remove('dragover');

      if (dragSource === 'bank' && draggedQuestionId) {
        addQuestionToSection(sec.id, draggedQuestionId);
      } else if (dragSource === 'canvas' && draggedQuestionId && draggedSectionId) {
        // Handle moving between sections or reordering within section
        if (draggedSectionId === sec.id) {
          // Reorder within the same section
          const target = e.target.closest('.paper-question-item');
          if (target && target.dataset.id !== draggedQuestionId) {
            const list = sec.questionIds;
            const srcIdx = list.indexOf(draggedQuestionId);
            const targetIdx = list.indexOf(target.dataset.id);
            
            list.splice(srcIdx, 1);
            list.splice(targetIdx, 0, draggedQuestionId);
            
            renderPaperCanvas();
            saveState();
          }
        } else {
          // Move from another section
          const srcSec = state.paperSections.find(s => s.id === draggedSectionId);
          if (srcSec) {
            srcSec.questionIds = srcSec.questionIds.filter(id => id !== draggedQuestionId);
            sec.questionIds.push(draggedQuestionId);
            
            renderPaperCanvas();
            renderStats();
            saveState();
            showToast("Moved question to section.", "success");
          }
        }
      }
    });

    // Section reordering logic
    const handle = secEl.querySelector('.section-drag-handle');
    secEl.addEventListener('dragstart', (e) => {
      if (e.target === handle || handle.contains(e.target)) {
        draggedSectionId = sec.id;
        e.dataTransfer.setData('text/plain', sec.id);
        secEl.style.opacity = '0.3';
      }
    });

    secEl.addEventListener('dragend', () => {
      secEl.style.opacity = '1';
    });

    container.appendChild(secEl);
  });

  // Global drop reorder sections
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    const secId = e.dataTransfer.getData('text/plain');
    if (secId && secId.startsWith('sec-')) {
      const targetSec = e.target.closest('.paper-section');
      if (targetSec && targetSec.dataset.id !== secId) {
        const list = state.paperSections;
        const srcIdx = list.findIndex(s => s.id === secId);
        const targetIdx = list.findIndex(s => s.id === targetSec.dataset.id);
        
        if (srcIdx !== -1 && targetIdx !== -1) {
          const [moved] = list.splice(srcIdx, 1);
          list.splice(targetIdx, 0, moved);
          
          renderPaperCanvas();
          saveState();
        }
      }
    }
  });

  lucide.createIcons();
}

// Calculate Stats and Ratio meters
function renderStats() {
  let count = 0;
  let totalMarks = 0;
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  state.paperSections.forEach(sec => {
    sec.questionIds.forEach(qId => {
      const q = state.bankQuestions.find(item => item.id === qId);
      if (q) {
        count++;
        totalMarks += q.marks;
        if (q.difficulty === 'easy') easyCount += q.marks;
        else if (q.difficulty === 'medium') mediumCount += q.marks;
        else if (q.difficulty === 'hard') hardCount += q.marks;
      }
    });
  });

  document.getElementById('stat-q-count').textContent = count;
  
  const tally = document.getElementById('stat-marks-tally');
  const target = state.paperMeta.targetMarks;
  tally.textContent = `${totalMarks} / ${target}`;
  
  const statusLabel = document.getElementById('stat-marks-status');
  if (totalMarks === parseInt(target)) {
    statusLabel.style.color = 'var(--success)';
    statusLabel.textContent = "Perfect Tally";
  } else if (totalMarks > parseInt(target)) {
    statusLabel.style.color = 'var(--danger)';
    statusLabel.textContent = `Excess by ${totalMarks - target}`;
  } else {
    statusLabel.style.color = 'var(--warning)';
    statusLabel.textContent = `Deficit by ${target - totalMarks}`;
  }

  // Difficulty Distribution CSS ratios
  const totalDiff = easyCount + mediumCount + hardCount || 1;
  const easyPct = (easyCount / totalDiff * 100).toFixed(0);
  const medPct = (mediumCount / totalDiff * 100).toFixed(0);
  const hardPct = (hardCount / totalDiff * 100).toFixed(0);

  const meter = document.getElementById('difficulty-dist');
  meter.querySelector('.dist-easy').style.width = `${easyPct}%`;
  meter.querySelector('.dist-easy').title = `Easy: ${easyPct}% (${easyCount} pts)`;
  meter.querySelector('.dist-medium').style.width = `${medPct}%`;
  meter.querySelector('.dist-medium').title = `Medium: ${medPct}% (${mediumCount} pts)`;
  meter.querySelector('.dist-hard').style.width = `${hardPct}%`;
  meter.querySelector('.dist-hard').title = `Hard: ${hardPct}% (${hardCount} pts)`;
}

// Toast Alert Manager
function showToast(message, type = "info") {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = "info";
  if (type === "success") icon = "check-circle-2";
  else if (type === "warning") icon = "alert-triangle";
  else if (type === "error") icon = "alert-circle";

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  // Trigger animations
  setTimeout(() => toast.classList.add('active'), 50);
  
  // Clean up
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Load and Process uploaded book (PDF)
async function handleBookUpload(file) {
  if (!file || file.type !== 'application/pdf') {
    showToast("Please upload a valid PDF book.", "error");
    return;
  }
  
  const loading = document.getElementById('upload-loading');
  const statusEl = document.getElementById('loading-text');
  
  loading.classList.add('active');
  statusEl.textContent = `Reading ${file.name}...`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    statusEl.textContent = `Extracting PDF layers...`;
    
    // Load document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Check if re-linking
    if (state.uploadedBook && state.uploadedBook.name === file.name && state.uploadedBook.totalPages === pdf.numPages) {
      window.currentBookArrayBuffer = arrayBuffer;
      window.currentPdfDoc = pdf;
      showToast("Book PDF linked successfully!", "success");
      renderBookExplorer();
      return;
    }

    state.uploadedBook = {
      name: file.name,
      totalPages: pdf.numPages
    };
    
    window.currentBookArrayBuffer = arrayBuffer;
    window.currentPdfDoc = pdf;
    
    statusEl.textContent = `Extracting chapters...`;
    
    // 1. Try Outline bookmarks
    let extractedChapters = await extractChaptersFromOutline(pdf);
    
    // 2. If empty and API key is set, try Gemini TOC Extraction
    if ((!extractedChapters || extractedChapters.length < 2) && state.apiKey) {
      statusEl.textContent = `No bookmarks found. Extracting TOC via Gemini AI...`;
      try {
        const tocText = await extractTOCText(pdf);
        extractedChapters = await extractChaptersWithAIFromTOC(tocText, pdf.numPages);
      } catch (aiErr) {
        console.warn("AI TOC extraction failed", aiErr);
      }
    }
    
    // 3. Fallback to local regex scanning
    if (!extractedChapters || extractedChapters.length < 2) {
      statusEl.textContent = `Using local regex scanner to find chapters...`;
      extractedChapters = await extractChaptersByRegex(pdf, (msg) => {
        statusEl.textContent = msg;
      });
    }
    
    // If still empty, initialize with default
    if (!extractedChapters || extractedChapters.length === 0) {
      extractedChapters = [
        {
          id: 'ch-default',
          chapterNumber: 1,
          title: 'Full Book / General Content',
          startPage: 1,
          endPage: pdf.numPages
        }
      ];
      showToast("No chapters automatically detected. Created default chapter.", "warning");
    } else {
      showToast(`Successfully loaded book with ${extractedChapters.length} chapters!`, "success");
    }
    
    state.chapters = extractedChapters;
    
    saveState();
    renderBookExplorer();
    
  } catch (err) {
    console.error(err);
    showToast(`Failed to parse book PDF: ${err.message}`, "error");
  } finally {
    loading.classList.remove('active');
  }
}

// Extract chapters from bookmarks outline
async function extractChaptersFromOutline(pdf) {
  try {
    const outline = await pdf.getOutline();
    if (!outline || outline.length === 0) return null;

    const items = [];
    async function traverse(node) {
      if (node.dest) {
        let pageIdx = -1;
        if (Array.isArray(node.dest)) {
          const ref = node.dest[0];
          if (ref && typeof ref === 'object') {
            try { pageIdx = await pdf.getPageIndex(ref); } catch (e) {}
          }
        } else if (typeof node.dest === 'string') {
          try {
            const destRef = await pdf.getDestination(node.dest);
            if (destRef && Array.isArray(destRef)) {
              pageIdx = await pdf.getPageIndex(destRef[0]);
            }
          } catch (e) {}
        }
        if (pageIdx !== -1) {
          items.push({
            title: node.title,
            startPage: pageIdx + 1
          });
        }
      }
      if (node.items && node.items.length > 0) {
        for (const child of node.items) {
          await traverse(child);
        }
      }
    }

    for (const topItem of outline) {
      await traverse(topItem);
    }

    if (items.length === 0) return null;

    // Sort by startPage
    items.sort((a, b) => a.startPage - b.startPage);

    // Calculate endPage for each
    const chapters = [];
    for (let i = 0; i < items.length; i++) {
      const current = items[i];
      const next = items[i + 1];
      const endPage = next ? next.startPage - 1 : pdf.numPages;
      
      chapters.push({
        id: 'ch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        chapterNumber: i + 1,
        title: current.title,
        startPage: current.startPage,
        endPage: Math.max(current.startPage, endPage)
      });
    }
    return chapters;
  } catch (err) {
    console.error("Failed to parse outline", err);
    return null;
  }
}

// Extract Table of Contents text from first few pages
async function extractTOCText(pdf) {
  const maxTOCPages = Math.min(12, pdf.numPages);
  let tocText = "";
  for (let pageNum = 1; pageNum <= maxTOCPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      tocText += `--- Page ${pageNum} ---\n` + pageText + "\n";
    } catch (e) {
      console.warn("Failed to extract page " + pageNum, e);
    }
  }
  return tocText;
}

// AI Table of Contents Chapter extractor
async function extractChaptersWithAIFromTOC(tocText, totalPages) {
  const apiKey = state.apiKey;
  if (!apiKey) return null;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `You are a textbook parsing assistant. Analyze this Table of Contents (TOC) text from a book with ${totalPages} total pages.
Identify the chapters, their names, and their starting page numbers.
If starting page numbers are not explicitly mentioned in the text, estimate them based on the total number of pages (${totalPages}) and the ordering of chapters.
Ensure that page numbers are valid integers. The end page of each chapter should be the start page of the next chapter minus 1, and the last chapter should end at page ${totalPages}.

Return ONLY a JSON array of chapter objects. Do not include markdown code blocks or additional text.
JSON Schema:
[
  {
    "chapterNumber": 1,
    "title": "Chapter title",
    "startPage": 5,
    "endPage": 20
  }
]

TOC Text:
${tocText}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) throw new Error("Gemini TOC extraction failed");

  const resData = await response.json();
  let rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  
  const chapters = JSON.parse(cleaned);
  return chapters.map((ch, idx) => ({
    id: 'ch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    chapterNumber: ch.chapterNumber || (idx + 1),
    title: ch.title,
    startPage: parseInt(ch.startPage) || 1,
    endPage: parseInt(ch.endPage) || totalPages
  }));
}

// Regex chapter scanner fallback
async function extractChaptersByRegex(pdf, statusCallback) {
  const chapters = [];
  const totalPages = pdf.numPages;
  
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (pageNum % 10 === 0) {
      if (statusCallback) statusCallback(`Scanning page ${pageNum}/${totalPages}...`);
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');
      
      const match = text.match(/(?:^|\n)\s*(?:CHAPTER|Chapter|Ch\.)\s+(\d+|[IVXLCDM]+)\b/i);
      if (match) {
        let title = `Chapter ${match[1]}`;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const chLineIdx = lines.findIndex(line => line.toLowerCase().includes('chapter') || line.toLowerCase().includes('ch.'));
        if (chLineIdx !== -1) {
          if (lines[chLineIdx + 1] && lines[chLineIdx + 1].length > 3 && lines[chLineIdx + 1].length < 100) {
            title = `Chapter ${match[1]}: ${lines[chLineIdx + 1]}`;
          } else {
            title = lines[chLineIdx];
          }
        }
        
        chapters.push({
          chapter: match[1],
          title: title,
          startPage: pageNum
        });
      }
    } catch (e) {
      console.warn("Failed to read page " + pageNum, e);
    }
  }
  
  if (chapters.length === 0) return null;
  
  chapters.sort((a, b) => a.startPage - b.startPage);
  
  const uniqueChapters = [];
  const seenChapters = new Set();
  
  chapters.forEach(ch => {
    const key = String(ch.chapter).toLowerCase();
    if (!seenChapters.has(key)) {
      seenChapters.add(key);
      uniqueChapters.push(ch);
    }
  });
  
  return uniqueChapters.map((ch, idx) => {
    const next = uniqueChapters[idx + 1];
    const endPage = next ? next.startPage - 1 : totalPages;
    return {
      id: 'ch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      chapterNumber: idx + 1,
      title: ch.title,
      startPage: ch.startPage,
      endPage: Math.max(ch.startPage, endPage)
    };
  });
}

// Render Book Explorer UI
function renderBookExplorer() {
  const box = document.getElementById('book-explorer-box');
  const titleEl = document.getElementById('book-title');
  const pagesEl = document.getElementById('book-pages');
  const listEl = document.getElementById('chapters-list');
  
  if (!state.uploadedBook) {
    box.style.display = 'none';
    return;
  }
  
  box.style.display = 'block';
  titleEl.textContent = state.uploadedBook.name;
  
  const isLinked = window.currentPdfDoc ? true : false;
  if (isLinked) {
    pagesEl.innerHTML = `${state.uploadedBook.totalPages} Pages <span class="badge badge-success" style="padding: 0.1rem 0.25rem; font-size: 0.6rem; margin-left: 0.25rem; background-color: var(--success); color: white;">Active</span>`;
  } else {
    pagesEl.innerHTML = `${state.uploadedBook.totalPages} Pages <span class="badge badge-warning" style="padding: 0.1rem 0.25rem; font-size: 0.6rem; margin-left: 0.25rem; cursor: pointer; background-color: var(--warning); color: white;" onclick="document.getElementById('file-input').click()">Re-link PDF</span>`;
  }
  
  listEl.innerHTML = "";
  
  if (!state.chapters || state.chapters.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; font-size: 0.75rem; color: var(--text-muted); padding: 1rem;">No chapters defined. Click "Add Chapter" to create one.</div>`;
    return;
  }
  
  state.chapters.forEach(ch => {
    const item = document.createElement('div');
    item.className = 'chapter-item';
    
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.25rem;">
        <div style="font-weight: 500; font-size: 0.75rem; color: var(--text-main); word-break: break-word;">
          ${ch.title}
        </div>
        <div style="display: flex; gap: 0.15rem; flex-shrink: 0;">
          <button onclick="openChapterGenModal('${ch.id}')" title="Generate questions" class="btn-icon-link" style="color: var(--primary);">
            <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i>
          </button>
          <button onclick="openChapterEditModal('${ch.id}')" title="Edit chapter" class="btn-icon-link" style="color: var(--text-muted);">
            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
          </button>
          <button onclick="deleteChapter('${ch.id}')" title="Delete chapter" class="btn-icon-link" style="color: var(--danger);">
            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
          </button>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; color: var(--text-muted); margin-top: 0.25rem;">
        <span>Pages ${ch.startPage} - ${ch.endPage}</span>
        <span style="font-style: italic;">Ch ${ch.chapterNumber}</span>
      </div>
    `;
    listEl.appendChild(item);
  });
  
  lucide.createIcons();
}

// Open Chapter Edit/Add Modal
function openChapterEditModal(chId = null) {
  const modalTitle = document.getElementById('chapter-edit-modal-title');
  const idInput = document.getElementById('chapter-edit-id');
  const titleInput = document.getElementById('chapter-modal-title');
  const startInput = document.getElementById('chapter-modal-start');
  const endInput = document.getElementById('chapter-modal-end');

  // Reset inputs
  idInput.value = "";
  titleInput.value = "";
  startInput.value = "";
  endInput.value = "";

  if (chId) {
    modalTitle.textContent = "Edit Chapter";
    const ch = state.chapters.find(c => c.id === chId);
    if (ch) {
      idInput.value = ch.id;
      titleInput.value = ch.title;
      startInput.value = ch.startPage;
      endInput.value = ch.endPage;
    }
  } else {
    modalTitle.textContent = "Add Chapter";
    let nextNum = 1;
    let nextStart = 1;
    if (state.chapters && state.chapters.length > 0) {
      const last = state.chapters[state.chapters.length - 1];
      nextNum = last.chapterNumber + 1;
      nextStart = last.endPage + 1;
    }
    titleInput.value = `Chapter ${nextNum}: `;
    startInput.value = nextStart;
    endInput.value = state.uploadedBook ? state.uploadedBook.totalPages : nextStart + 10;
  }

  openModal('chapter-edit-modal-overlay');
}

// Save Chapter (Add or Edit)
function saveChapter() {
  const id = document.getElementById('chapter-edit-id').value;
  const title = document.getElementById('chapter-modal-title').value.trim();
  const startPage = parseInt(document.getElementById('chapter-modal-start').value);
  const endPage = parseInt(document.getElementById('chapter-modal-end').value);

  if (!title) {
    showToast("Please enter a chapter title.", "error");
    return;
  }
  if (isNaN(startPage) || isNaN(endPage) || startPage < 1 || endPage < startPage) {
    showToast("Please enter valid start and end page numbers.", "error");
    return;
  }
  if (state.uploadedBook && (startPage > state.uploadedBook.totalPages || endPage > state.uploadedBook.totalPages)) {
    showToast(`Page numbers cannot exceed total pages in the book (${state.uploadedBook.totalPages}).`, "error");
    return;
  }

  if (id) {
    // Edit existing
    const idx = state.chapters.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.chapters[idx] = { ...state.chapters[idx], title, startPage, endPage };
      showToast("Chapter updated!", "success");
    }
  } else {
    // Add new
    const nextNum = state.chapters.length + 1;
    const newCh = {
      id: 'ch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      chapterNumber: nextNum,
      title,
      startPage,
      endPage
    };
    state.chapters.push(newCh);
    state.chapters.sort((a, b) => a.startPage - b.startPage);
    state.chapters.forEach((c, index) => c.chapterNumber = index + 1);
    showToast("Chapter added!", "success");
  }

  closeModal('chapter-edit-modal-overlay');
  renderBookExplorer();
  saveState();
}

// Delete Chapter
function deleteChapter(chId) {
  if (confirm("Are you sure you want to delete this chapter?")) {
    state.chapters = state.chapters.filter(c => c.id !== chId);
    state.chapters.forEach((c, index) => c.chapterNumber = index + 1);
    renderBookExplorer();
    saveState();
    showToast("Chapter deleted.", "warning");
  }
}

// Open Chapter Generation Modal
function openChapterGenModal(chId) {
  const ch = state.chapters.find(c => c.id === chId);
  if (!ch) return;

  document.getElementById('gen-chapter-id').value = chId;
  document.getElementById('chapter-gen-modal-title').textContent = `Generate Questions: ${ch.title}`;
  
  document.getElementById('chapter-gen-count').value = "5";
  document.getElementById('chapter-gen-type').value = "mix";
  document.getElementById('chapter-gen-difficulty').value = "mix";
  document.getElementById('chapter-gen-marks').value = "";

  if (!state.apiKey) {
    showToast("Please configure your Gemini API Key in the sidebar first.", "warning");
  }

  openModal('chapter-gen-modal-overlay');
}

// Generate questions using Gemini API
async function triggerChapterQuestionGeneration() {
  const chId = document.getElementById('gen-chapter-id').value;
  const count = parseInt(document.getElementById('chapter-gen-count').value) || 5;
  const type = document.getElementById('chapter-gen-type').value;
  const difficulty = document.getElementById('chapter-gen-difficulty').value;
  const customMarks = document.getElementById('chapter-gen-marks').value;

  const ch = state.chapters.find(c => c.id === chId);
  if (!ch) {
    showToast("Selected chapter not found.", "error");
    return;
  }

  if (!state.apiKey) {
    showToast("Gemini API Key is required to generate questions. Please set it in the sidebar.", "error");
    closeModal('chapter-gen-modal-overlay');
    openModal('api-modal-overlay');
    return;
  }

  if (!window.currentPdfDoc) {
    showToast("Book PDF is not linked. Please click 'Re-link PDF' and select the file.", "error");
    closeModal('chapter-gen-modal-overlay');
    document.getElementById('file-input').click();
    return;
  }

  closeModal('chapter-gen-modal-overlay');
  
  const loading = document.getElementById('upload-loading');
  const statusEl = document.getElementById('loading-text');
  loading.classList.add('active');
  statusEl.textContent = `Extracting text for ${ch.title} (Pages ${ch.startPage} - ${ch.endPage})...`;

  try {
    let chapterText = "";
    for (let pageNum = ch.startPage; pageNum <= Math.min(ch.endPage, state.uploadedBook.totalPages); pageNum++) {
      statusEl.textContent = `Extracting page ${pageNum}...`;
      try {
        const page = await window.currentPdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        chapterText += `\n--- PAGE ${pageNum} ---\n` + pageText;
      } catch (e) {
        console.warn(`Failed to extract page ${pageNum}`, e);
      }
    }

    if (chapterText.trim().length < 50) {
      throw new Error("Extracted text is too short. The PDF pages might be scanned images. Scanned PDFs are not fully supported for direct text generation without OCR.");
    }

    statusEl.textContent = `AI generating ${count} questions...`;
    
    const parsedQuestions = await generateQuestionsWithAI(chapterText, ch.title, count, type, difficulty, customMarks);
    
    if (parsedQuestions && parsedQuestions.length > 0) {
      appendQuestionsToBank(parsedQuestions);
      populateFilters();
      renderQuestionBank();
      saveState();
      showToast(`Successfully generated ${parsedQuestions.length} questions for ${ch.title}!`, "success");
    } else {
      showToast("No questions were generated.", "warning");
    }

  } catch (err) {
    console.error(err);
    showToast(`Failed to generate questions: ${err.message}`, "error");
  } finally {
    loading.classList.remove('active');
  }
}

// Generate questions call to Gemini
async function generateQuestionsWithAI(chapterText, chapterTitle, count, type, difficulty, customMarks) {
  const apiKey = state.apiKey;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let typeInstruction = "";
  if (type === "mcq") {
    typeInstruction = "Generate only Multiple Choice Questions (MCQ). Each MCQ must have exactly 4 items in 'options' and the correct answer text in 'answer'. Do NOT include the A/B/C/D option prefixes in the question text or the options array.";
  } else if (type === "short") {
    typeInstruction = "Generate only Short Answer Questions (marks weight should be 2 or 3). 'options' should be null, and 'answer' should contain the expected short answer key/rubric.";
  } else if (type === "long") {
    typeInstruction = "Generate only Long/Detailed Answer Questions (marks weight should be 5). 'options' should be null, and 'answer' should contain details of the main points required for full marks.";
  } else if (type === "fill") {
    typeInstruction = "Generate only 'Fill in the blanks' questions. 'options' should be null, and 'answer' should contain the correct blank filler word.";
  } else {
    typeInstruction = "Generate a mix of MCQ, Short Answer, and Long Answer questions.";
  }

  let diffInstruction = "";
  if (difficulty !== "mix") {
    diffInstruction = `The difficulty level for all questions must be exactly '${difficulty}'.`;
  } else {
    diffInstruction = "Generate a balanced mix of easy, medium, and hard questions.";
  }

  let marksInstruction = "";
  if (customMarks) {
    marksInstruction = `Each question must have exactly ${customMarks} marks.`;
  } else {
    marksInstruction = "Default marks weight should be: MCQ = 1 mark, Fill in the blanks = 1 mark, Short Answer = 2 or 3 marks, Long Answer = 5 marks.";
  }

  const prompt = `You are an expert curriculum developer. Read the textbook content provided below and generate exactly ${count} exam-grade questions from it.
The topic for these questions is "${chapterTitle}".

--- TEXTBOOK SOURCE CONTENT ---
${chapterText}
-------------------------------

Constraints for Generation:
1. Questions must be derived ONLY from the facts, concepts, and formulas explicitly mentioned in the text.
2. ${typeInstruction}
3. ${diffInstruction}
4. ${marksInstruction}

Return the results strictly as a valid JSON array of question objects. Do not wrap it in markdown code fences or write any conversational introduction/outro.
JSON Schema structure:
[
  {
    "question": "The question prompt text",
    "options": ["Option A", "Option B", "Option C", "Option D"] or null,
    "answer": "Correct answer / rubric",
    "subject": "${state.paperMeta.subject || "General"}",
    "topic": "${chapterTitle}",
    "difficulty": "easy", "medium", or "hard",
    "type": "mcq", "short", "long", or "fill",
    "marks": a number
  }
]`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Gemini API call failed");
  }

  const resData = await response.json();
  let rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  
  return JSON.parse(cleaned);
}

// Bind to window for global inline event accessibility
window.openChapterGenModal = openChapterGenModal;
window.openChapterEditModal = openChapterEditModal;
window.deleteChapter = deleteChapter;

// AI Question extraction via Gemini API
async function extractQuestionsWithAI(content, isImage = false, mimeType = '') {
  const apiKey = state.apiKey;
  if (!apiKey) throw new Error("No API key available");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let parts = [
    {
      text: `You are an expert exam paper parsing engine. Your job is to extract questions from the provided source (text or image) and format them as a valid JSON array of question objects.
Each question object MUST strictly follow this JSON schema:
{
  "question": "The question prompt text. For multiple choice questions (MCQ), do NOT include the options inside the question string itself; list them inside the options array instead. For other question types, keep it clean.",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"] or null if the question is not an MCQ,
  "answer": "The correct option text (for MCQ), or the correct answers/fill-ins/marking rubric text (for other types)",
  "subject": "The primary subject (e.g. Mathematics, Physics, Chemistry, Biology, History, English, Computer Science)",
  "topic": "The specific chapter or concept topic (e.g. Electromagnetism, Cell Division, Calculus, Organic compounds)",
  "difficulty": "easy", "medium", or "hard",
  "type": "mcq", "short", "long", or "fill",
  "marks": a number representing the score weight (estimate if missing, e.g., MCQ = 1, Short = 2-3, Long = 5-10, Fill = 1)
}

Analyze the input text or image carefully, extract as many complete questions as possible, correct any OCR typos in the question text to make it read professionally, and return ONLY a JSON array containing these question objects. Do not write any markdown code fences like \`\`\`json or explanation text, just output the raw JSON array string.`
    }
  ];

  if (isImage) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: content
      }
    });
  } else {
    parts.push({
      text: content
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: parts }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Failed to contact Gemini API");
  }

  const resData = await response.json();
  const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
  
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  
  return JSON.parse(cleaned);
}

// Local Question Parser
function parseQuestionsLocally(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];
  let currentQuestion = null;
  
  const questionRegex = /^(?:Q|q|Question|question)?\s*(\d+)[\.\):-]\s+(.+)/i;
  const optionRegex = /^[A-Da-d][\.\):-]\s*(.+)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const qMatch = line.match(questionRegex);
    
    if (qMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        id: "local-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        question: qMatch[2],
        options: null,
        answer: "",
        subject: document.getElementById('meta-subject').value || "General",
        topic: "Imported",
        difficulty: "medium",
        type: "short",
        marks: 2
      };
    } else if (currentQuestion) {
      const optMatch = line.match(optionRegex);
      if (optMatch) {
        if (!currentQuestion.options) {
          currentQuestion.options = [];
          currentQuestion.type = "mcq";
          currentQuestion.marks = 1;
        }
        currentQuestion.options.push(optMatch[1]);
      } else {
        currentQuestion.question += " " + line;
      }
    } else {
      currentQuestion = {
        id: "local-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        question: line,
        options: null,
        answer: "",
        subject: document.getElementById('meta-subject').value || "General",
        topic: "Imported",
        difficulty: "medium",
        type: "short",
        marks: 2
      };
    }
  }
  
  if (currentQuestion) {
    questions.push(currentQuestion);
  }
  
  return questions;
}

function appendQuestionsToBank(arr) {
  if (!Array.isArray(arr)) return;
  arr.forEach(item => {
    // Inject unique id
    item.id = 'ai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    state.bankQuestions.unshift(item);
  });
}

// Auto-generation algorithm based on target marks and difficulty distribution
function triggerAutoGeneration() {
  const target = parseInt(document.getElementById('gen-total-marks').value) || 25;
  const focusSub = document.getElementById('gen-subject').value;
  const pctEasy = parseInt(document.getElementById('gen-ratio-easy').value) || 40;
  const pctMed = parseInt(document.getElementById('gen-ratio-medium').value) || 40;
  const pctHard = parseInt(document.getElementById('gen-ratio-hard').value) || 20;

  if (pctEasy + pctMed + pctHard !== 100) {
    showToast("Difficulty percentages must equal exactly 100%.", "error");
    return;
  }

  // Filter bank questions by focus subject
  let pool = state.bankQuestions;
  if (focusSub) {
    pool = pool.filter(q => q.subject === focusSub);
  }

  if (pool.length === 0) {
    showToast("No questions available in the pool for this subject.", "error");
    return;
  }

  // Calculate target marks for each difficulty tier
  const easyTarget = Math.round(target * pctEasy / 100);
  const medTarget = Math.round(target * pctMed / 100);
  const hardTarget = target - easyTarget - medTarget;

  // Split pool into difficulties
  const easyPool = pool.filter(q => q.difficulty === 'easy');
  const medPool = pool.filter(q => q.difficulty === 'medium');
  const hardPool = pool.filter(q => q.difficulty === 'hard');

  // Simple greedy selection algorithm
  const selectQuestions = (qPool, targetMarks) => {
    let currentMarks = 0;
    const selected = [];
    // Shuffle pool
    const shuffled = [...qPool].sort(() => 0.5 - Math.random());
    
    for (const q of shuffled) {
      if (currentMarks + q.marks <= targetMarks + 2) { // Allow slight buffer
        selected.push(q.id);
        currentMarks += q.marks;
        if (currentMarks >= targetMarks) break;
      }
    }
    return { ids: selected, marks: currentMarks };
  };

  const easySelect = selectQuestions(easyPool, easyTarget);
  const medSelect = selectQuestions(medPool, medTarget);
  const hardSelect = selectQuestions(hardPool, hardTarget);

  const selectedIds = [...easySelect.ids, ...medSelect.ids, ...hardSelect.ids];
  
  if (selectedIds.length === 0) {
    showToast("Could not generate paper. Try uploading more questions to the bank.", "error");
    return;
  }

  // Set up three structured sections
  state.paperSections = [
    {
      id: 'gen-sec-a',
      title: 'Section A - Easy Questions',
      questionIds: easySelect.ids
    },
    {
      id: 'gen-sec-b',
      title: 'Section B - Intermediate Questions',
      questionIds: medSelect.ids
    },
    {
      id: 'gen-sec-c',
      title: 'Section C - Advanced Questions',
      questionIds: hardSelect.ids
    }
  ].filter(sec => sec.questionIds.length > 0);

  closeModal('auto-gen-modal-overlay');
  renderPaperCanvas();
  renderStats();
  saveState();
  
  const finalScore = easySelect.marks + medSelect.marks + hardSelect.marks;
  showToast(`Auto-generated paper successfully! Total marks: ${finalScore}`, "success");
}

// Backup JSON file creators
function exportBackupJSON() {
  const backupData = {
    bankQuestions: state.bankQuestions,
    paperMeta: state.paperMeta,
    paperSections: state.paperSections
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `aurapaper-backup-${Date.now()}.json`);
  dlAnchorElem.click();
}

function importBackupJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (data.bankQuestions && data.paperMeta && data.paperSections) {
        state.bankQuestions = data.bankQuestions;
        state.paperMeta = data.paperMeta;
        state.paperSections = data.paperSections;

        // Sync inputs
        document.getElementById('meta-school').value = state.paperMeta.school;
        document.getElementById('meta-exam').value = state.paperMeta.exam;
        document.getElementById('meta-subject').value = state.paperMeta.subject;
        document.getElementById('meta-class').value = state.paperMeta.grade;
        document.getElementById('meta-time').value = state.paperMeta.time;
        document.getElementById('meta-marks').value = state.paperMeta.targetMarks;
        document.getElementById('meta-instructions').value = state.paperMeta.instructions.join('\n');

        closeModal('backup-modal-overlay');
        populateFilters();
        renderQuestionBank();
        renderPaperCanvas();
        renderStats();
        saveState();
        showToast("Backup imported successfully!", "success");
      } else {
        showToast("Invalid backup JSON structure.", "error");
      }
    } catch(err) {
      showToast("Error parsing backup file.", "error");
    }
  };
  reader.readAsText(file);
}

// Open Print Preview View
function openPrintPreview() {
  document.getElementById('print-preview-overlay').classList.add('active');
  renderPrintPreviewCanvas();
  applyPrintStyles();
}

function closePrintPreview() {
  document.getElementById('print-preview-overlay').classList.remove('active');
}

// Render dynamic paper canvas inside preview
function renderPrintPreviewCanvas() {
  const canvas = document.getElementById('print-paper-canvas');
  canvas.innerHTML = "";

  const meta = state.paperMeta;
  const showAnswers = document.getElementById('print-toggle-answers').checked;
  const showMarks = document.getElementById('print-toggle-marks').checked;

  // Format instructions
  let instructionsHtml = "";
  if (meta.instructions && meta.instructions.length > 0) {
    instructionsHtml = `
      <div class="print-instructions">
        <p>Instructions to Candidates:</p>
        <ol style="padding-left: 1.25rem; margin-top: 0.25rem;">
          ${meta.instructions.map(inst => `<li>${inst}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  // Double border header
  let headerHtml = `
    <div class="print-exam-header">
      <div class="print-institution">${meta.school}</div>
      <div class="print-exam-title">${meta.exam}</div>
      <div class="print-meta-grid">
        <div><strong>Subject:</strong> ${meta.subject}</div>
        <div><strong>Grade/Class:</strong> ${meta.grade}</div>
        <div><strong>Time Allowed:</strong> ${meta.time}</div>
        <div><strong>Maximum Marks:</strong> ${meta.targetMarks} Marks</div>
      </div>
    </div>
    ${instructionsHtml}
  `;

  canvas.innerHTML += headerHtml;

  // Render paper content sections
  let globalQIndex = 1;
  const answersList = [];

  state.paperSections.forEach(sec => {
    if (sec.questionIds.length === 0) return;

    let secHtml = `
      <div class="print-sec">
        <div class="print-sec-title">
          <span>${sec.title}</span>
        </div>
        <div class="print-q-list">
    `;

    sec.questionIds.forEach(qId => {
      const q = state.bankQuestions.find(item => item.id === qId);
      if (!q) return;

      // Track answers
      answersList.push({
        num: globalQIndex,
        question: q.question,
        answer: q.answer
      });

      // Options formatting
      let optionsHtml = "";
      if (q.type === 'mcq' && q.options) {
        optionsHtml = `<div class="print-q-opts">`;
        q.options.forEach((opt, idx) => {
          optionsHtml += `
            <div class="print-q-opt">
              <span>(${String.fromCharCode(97 + idx)})</span>
              <span>${opt}</span>
            </div>
          `;
        });
        optionsHtml += `</div>`;
      }

      // Mark display formatter
      const marksHtml = showMarks ? `<span class="print-q-marks">[${q.marks}]</span>` : '';

      secHtml += `
        <div class="print-q-item">
          <div class="print-q-body">
            <div class="print-q-text">
              <strong>Q${globalQIndex}.</strong> ${q.question}
            </div>
            ${optionsHtml}
          </div>
          ${marksHtml}
        </div>
      `;

      globalQIndex++;
    });

    secHtml += `
        </div>
      </div>
    `;

    canvas.innerHTML += secHtml;
  });

  // Render answer scheme section if checked
  if (showAnswers && answersList.length > 0) {
    let keyHtml = `
      <div class="print-answer-key-section">
        <h2 style="font-size: 1.25rem; font-weight: bold; border-bottom: 2px solid black; margin-bottom: 1rem; padding-bottom: 0.25rem; text-transform: uppercase;">
          Answer Key & Evaluation Scheme
        </h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
    `;

    answersList.forEach(ans => {
      keyHtml += `
        <div class="print-key-item">
          <div class="print-key-q">Q${ans.num}. ${ans.question}</div>
          <div class="print-key-ans"><strong>Answer:</strong> ${ans.answer || 'No correct answer provided.'}</div>
        </div>
      `;
    });

    keyHtml += `
        </div>
      </div>
    `;

    canvas.innerHTML += keyHtml;
  }
}

// Adjust printable settings on canvas dynamically
function applyPrintStyles() {
  const canvas = document.getElementById('print-paper-canvas');
  
  const font = document.getElementById('print-setting-font').value;
  const size = document.getElementById('print-setting-size').value;
  const spacing = document.getElementById('print-setting-spacing').value;
  const margin = document.getElementById('print-setting-margin').value;

  canvas.style.fontFamily = font;
  canvas.style.fontSize = size;
  canvas.style.lineHeight = spacing;
  canvas.style.padding = `${margin} ${margin}`;
}

// Export paper to MS Word document using XML/HTML styling
function exportWordDocument() {
  const meta = state.paperMeta;
  const showAnswers = document.getElementById('print-toggle-answers').checked;
  const showMarks = document.getElementById('print-toggle-marks').checked;
  const fontSetting = document.getElementById('print-setting-font').value;

  let htmlString = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${meta.exam} - ${meta.subject}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: ${fontSetting.includes('Times') ? "'Times New Roman', serif" : fontSetting};
          font-size: 11pt;
          line-height: 1.5;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .header-cell-center {
          text-align: center;
          padding: 5px;
        }
        .institution {
          font-size: 16pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .exam-title {
          font-size: 13pt;
          font-weight: bold;
        }
        .meta-table {
          width: 100%;
          border-top: 2px solid black;
          border-bottom: 2px solid black;
          margin-top: 10px;
          margin-bottom: 20px;
          border-collapse: collapse;
        }
        .meta-table td {
          padding: 6px;
          font-size: 10.5pt;
        }
        .instructions-box {
          font-size: 9.5pt;
          margin-bottom: 25px;
          font-style: italic;
        }
        .instructions-title {
          font-weight: bold;
          font-style: normal;
          margin-bottom: 5px;
        }
        .section-title {
          font-size: 11.5pt;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid black;
          margin-top: 25px;
          margin-bottom: 15px;
          padding-bottom: 3px;
        }
        .q-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .q-table td {
          vertical-align: top;
          padding: 4px 0;
        }
        .q-num-cell {
          width: 35px;
          font-weight: bold;
        }
        .q-text-cell {
          padding-right: 15px;
        }
        .q-marks-cell {
          width: 40px;
          text-align: right;
          font-weight: bold;
        }
        .options-table {
          width: 100%;
          margin-top: 6px;
          border-collapse: collapse;
        }
        .options-table td {
          width: 50%;
          padding: 3px 0;
          font-size: 10pt;
        }
        .answer-key-header {
          font-size: 13pt;
          font-weight: bold;
          border-bottom: 2px solid black;
          margin-top: 40px;
          margin-bottom: 15px;
          text-transform: uppercase;
          page-break-before: always;
        }
        .key-item {
          margin-bottom: 15px;
        }
        .key-q {
          font-weight: bold;
        }
        .key-ans {
          margin-top: 4px;
          padding-left: 15px;
          color: #333333;
        }
      </style>
    </head>
    <body>
  `;

  htmlString += `
    <table class="header-table">
      <tr>
        <td class="header-cell-center">
          <div class="institution">${meta.school}</div>
          <div class="exam-title">${meta.exam}</div>
        </td>
      </tr>
    </table>

    <table class="meta-table">
      <tr>
        <td><strong>Subject:</strong> ${meta.subject}</td>
        <td style="text-align: right;"><strong>Grade/Class:</strong> ${meta.grade}</td>
      </tr>
      <tr>
        <td><strong>Time Allowed:</strong> ${meta.time}</td>
        <td style="text-align: right;"><strong>Maximum Marks:</strong> ${meta.targetMarks} Marks</td>
      </tr>
    </table>
  `;

  if (meta.instructions && meta.instructions.length > 0) {
    htmlString += `
      <div class="instructions-box">
        <div class="instructions-title">Instructions to Candidates:</div>
        <ol style="margin-top: 2px; margin-bottom: 0;">
          ${meta.instructions.map(inst => `<li>${inst}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  let globalQIndex = 1;
  const answersList = [];

  state.paperSections.forEach(sec => {
    if (sec.questionIds.length === 0) return;

    htmlString += `
      <div class="section-title">${sec.title}</div>
    `;

    sec.questionIds.forEach(qId => {
      const q = state.bankQuestions.find(item => item.id === qId);
      if (!q) return;

      answersList.push({
        num: globalQIndex,
        question: q.question,
        answer: q.answer
      });

      htmlString += `
        <table class="q-table">
          <tr>
            <td class="q-num-cell">Q${globalQIndex}.</td>
            <td class="q-text-cell">
              <div>${q.question}</div>
      `;

      if (q.type === 'mcq' && q.options) {
        htmlString += `<table class="options-table"><tr>`;
        q.options.forEach((opt, idx) => {
          if (idx > 0 && idx % 2 === 0) {
            htmlString += `</tr><tr>`;
          }
          htmlString += `<td>(${String.fromCharCode(97 + idx)}) ${opt}</td>`;
        });
        if (q.options.length % 2 !== 0) {
          htmlString += `<td></td>`;
        }
        htmlString += `</tr></table>`;
      }

      htmlString += `
            </td>
            <td class="q-marks-cell">${showMarks ? `[${q.marks}]` : ''}</td>
          </tr>
        </table>
      `;

      globalQIndex++;
    });
  });

  if (showAnswers && answersList.length > 0) {
    htmlString += `
      <div class="answer-key-header">Answer Key & Evaluation Scheme</div>
    `;

    answersList.forEach(ans => {
      htmlString += `
        <div class="key-item">
          <div class="key-q">Q${ans.num}. ${ans.question}</div>
          <div class="key-ans"><strong>Answer:</strong> ${ans.answer || 'No correct answer provided.'}</div>
        </div>
      `;
    });
  }

  htmlString += `
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlString], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const filename = `${meta.exam.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${meta.subject.toLowerCase().replace(/[^a-z0-9]/g, '_')}.doc`;
  a.download = filename;
  
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  showToast("Word document download initiated!", "success");
}

document.addEventListener('DOMContentLoaded', () => {
  let questionsData = [];
  let currentQuestions = [];
  let currentIndex = 0;
  let userAnswers = {};
  let isExamMode = false;
  let timerInterval = null;
  let timeRemaining = 7200; // 120 mins for full exam mode

  // Elements
  const navTabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const domainFilter = document.getElementById('domain-filter');
  const modeFilter = document.getElementById('mode-filter');
  const questionJumpSelect = document.getElementById('question-jump-select');
  const filterDomainBtns = document.querySelectorAll('.filter-domain-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const btnToggleGrid = document.getElementById('btn-toggle-grid');
  const questionGridPalette = document.getElementById('question-grid-palette');
  const paletteButtonsContainer = document.getElementById('palette-buttons-container');
  
  const questionContainer = document.getElementById('question-container');
  const examResults = document.getElementById('exam-results');
  
  const qDomainBadge = document.getElementById('q-domain-badge');
  const qCaseBadge = document.getElementById('q-case-badge');
  const qTopicBadge = document.getElementById('q-topic-badge');
  const qTitle = document.getElementById('q-title');
  const optionsList = document.getElementById('options-list');
  const explanationBox = document.getElementById('explanation-box');
  const expCorrectText = document.getElementById('exp-correct-text');
  const expDistractorsList = document.getElementById('exp-distractors-list');
  
  const questionProgress = document.getElementById('question-progress');
  const examTimer = document.getElementById('exam-timer');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnRestart = document.getElementById('btn-restart');

  // Theme Management (Fixes issue where theme click emptied page)
  const savedTheme = localStorage.getItem('gcp_theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isDark = document.body.classList.contains('dark-theme');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('gcp_theme', newTheme);
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      if (themeToggleBtn) themeToggleBtn.textContent = '☀️ Light';
    } else {
      document.body.classList.remove('dark-theme');
      if (themeToggleBtn) themeToggleBtn.textContent = '🌙 Dark';
    }
  }

  // Modular Data Source Files
  const domainFiles = [
    'data/domain1_design_and_plan.json',
    'data/domain2_provision_and_infrastructure.json',
    'data/domain3_security_and_compliance.json',
    'data/domain4_process_optimization_and_cost.json',
    'data/domain5_managing_implementations.json',
    'data/domain6_reliability_and_operations.json'
  ];

  // Load Questions Data
  Promise.all(domainFiles.map(file => fetch(file).then(r => r.json())))
    .then(results => {
      questionsData = results.flat();
      filterQuestions();
    })
    .catch(() => {
      fetch('data/questions.json')
        .then(res => res.json())
        .then(data => {
          questionsData = data;
          filterQuestions();
        })
        .catch(err => {
          console.error('Failed to load question dataset:', err);
          qTitle.textContent = 'Error loading question dataset.';
        });
    });

  // Load & Render Decision Matrices JSON
  fetch('data/decision_matrices.json')
    .then(res => res.json())
    .then(matrices => {
      renderDecisionMatrices(matrices);
    })
    .catch(err => {
      console.warn('Using static HTML matrices:', err);
    });

  function renderDecisionMatrices(data) {
    const cheatsheetGrid = document.querySelector('.cheatsheet-grid');
    if (!cheatsheetGrid || !data) return;

    cheatsheetGrid.innerHTML = `
      <!-- 1. Compute Matrix -->
      <div class="card matrix-card">
        <h3>⚡ 1. Compute, Container & Serverless Engine Matrix (${data.computeMatrix.length} Scenarios)</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Recommended Compute Target</th>
              <th>Scaling Model</th>
              <th>Primary Exam Trade-Off</th>
            </tr>
          </thead>
          <tbody>
            ${data.computeMatrix.map(row => `
              <tr>
                <td>${row.requirement}</td>
                <td><strong>${row.recommended}</strong></td>
                <td>${row.scaling}</td>
                <td>${row.tradeoff}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2. Database & Storage Matrix -->
      <div class="card matrix-card">
        <h3>📊 2. Database & Data Storage Selection Matrix (${data.databaseStorageMatrix.length} Scenarios)</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Recommended GCP Service</th>
              <th>Scalability & SLA</th>
              <th>Primary Exam Trade-Off</th>
            </tr>
          </thead>
          <tbody>
            ${data.databaseStorageMatrix.map(row => `
              <tr>
                <td>${row.requirement}</td>
                <td><strong>${row.recommended}</strong></td>
                <td>${row.scalability}</td>
                <td>${row.tradeoff}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 3. Networking & Load Balancing Matrix -->
      <div class="card matrix-card">
        <h3>🌐 3. Networking, Load Balancing & Hybrid Connectivity Matrix (${data.networkingLoadBalancingMatrix.length} Scenarios)</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Recommended Networking Solution</th>
              <th>Scope / Bandwidth</th>
              <th>Key Exam Characteristic</th>
            </tr>
          </thead>
          <tbody>
            ${data.networkingLoadBalancingMatrix.map(row => `
              <tr>
                <td>${row.requirement}</td>
                <td><strong>${row.recommended}</strong></td>
                <td>${row.scope}</td>
                <td>${row.characteristic}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 4. Security & Compliance Matrix -->
      <div class="card matrix-card">
        <h3>🔒 4. Security, IAM, Encryption & Compliance Matrix (${data.securityComplianceMatrix.length} Scenarios)</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Recommended GCP Tool</th>
              <th>Key Exam Rationale</th>
            </tr>
          </thead>
          <tbody>
            ${data.securityComplianceMatrix.map(row => `
              <tr>
                <td>${row.requirement}</td>
                <td><strong>${row.recommended}</strong></td>
                <td>${row.rationale}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 5. Analytics & AI Matrix -->
      <div class="card matrix-card">
        <h3>🤖 5. Data Analytics, Messaging & AI Matrix (${data.analyticsAiMatrix.length} Scenarios)</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Recommended Service</th>
              <th>Operational Characteristic</th>
            </tr>
          </thead>
          <tbody>
            ${data.analyticsAiMatrix.map(row => `
              <tr>
                <td>${row.requirement}</td>
                <td><strong>${row.recommended}</strong></td>
                <td>${row.rationale}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 6. Disaster Recovery Matrix -->
      <div class="card matrix-card">
        <h3>🚨 6. Disaster Recovery & Availability Strategy Matrix (${data.disasterRecoveryMatrix.length} Scenarios)</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>RTO / RPO Target</th>
              <th>DR Strategy</th>
              <th>Recommended Architecture</th>
            </tr>
          </thead>
          <tbody>
            ${data.disasterRecoveryMatrix.map(row => `
              <tr>
                <td><strong>${row.requirement}</strong></td>
                <td>${row.recommended}</td>
                <td>${row.architecture}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 7. Migration Matrix -->
      <div class="card matrix-card">
        <h3>🚚 7. Migration Tooling & Strategy Matrix (${data.migrationToolingMatrix.length} Scenarios)</h3>
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Migration Scenario</th>
              <th>Recommended Tool</th>
              <th>Migration Mechanism</th>
            </tr>
          </thead>
          <tbody>
            ${data.migrationToolingMatrix.map(row => `
              <tr>
                <td>${row.scenario}</td>
                <td><strong>${row.tool}</strong></td>
                <td>${row.mechanism}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Tab Navigation (Targeting .nav-tab-btn ONLY)
  navTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      navTabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const activeEl = document.getElementById(targetTab);
      if (activeEl) activeEl.classList.add('active');
    });
  });

  // Domain Filter Buttons on Syllabus Tab
  filterDomainBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const domainName = btn.getAttribute('data-domain-name');
      domainFilter.value = domainName;
      
      // Switch to Quiz Tab
      const quizTabBtn = document.querySelector('[data-tab="tab-quiz"]');
      if (quizTabBtn) quizTabBtn.click();
      filterQuestions();
    });
  });

  domainFilter.addEventListener('change', filterQuestions);
  modeFilter.addEventListener('change', () => {
    isExamMode = modeFilter.value === 'EXAM';
    filterQuestions();
  });

  // Jump to Question Select Listener
  if (questionJumpSelect) {
    questionJumpSelect.addEventListener('change', () => {
      const idx = parseInt(questionJumpSelect.value, 10);
      if (!isNaN(idx) && idx >= 0 && idx < currentQuestions.length) {
        currentIndex = idx;
        renderQuestion();
      }
    });
  }

  // Toggle Palette Drawer
  if (btnToggleGrid) {
    btnToggleGrid.addEventListener('click', () => {
      questionGridPalette.classList.toggle('hidden');
    });
  }

  function filterQuestions() {
    const selectedDomain = domainFilter.value;
    if (selectedDomain === 'ALL') {
      currentQuestions = [...questionsData];
    } else {
      currentQuestions = questionsData.filter(q => q.domain === selectedDomain);
    }
    
    currentIndex = 0;
    userAnswers = {};
    questionContainer.classList.remove('hidden');
    examResults.classList.add('hidden');
    
    if (isExamMode) {
      examTimer.classList.remove('hidden');
      startTimer();
    } else {
      examTimer.classList.add('hidden');
      clearInterval(timerInterval);
    }

    populateJumpSelect();
    renderQuestion();
  }

  function populateJumpSelect() {
    if (!questionJumpSelect) return;
    questionJumpSelect.innerHTML = '';
    
    currentQuestions.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const topicTruncated = q.topic.length > 24 ? q.topic.substring(0, 24) + '...' : q.topic;
      opt.textContent = `Q${idx + 1}: ${topicTruncated}`;
      questionJumpSelect.appendChild(opt);
    });
  }

  function renderPaletteGrid() {
    if (!paletteButtonsContainer) return;
    paletteButtonsContainer.innerHTML = '';

    currentQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = idx + 1;

      if (idx === currentIndex) {
        btn.classList.add('active');
      }

      const answered = userAnswers[q.id];
      if (answered) {
        if (answered === q.correctAnswer) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('incorrect');
        }
      }

      btn.addEventListener('click', () => {
        currentIndex = idx;
        renderQuestion();
      });

      paletteButtonsContainer.appendChild(btn);
    });
  }

  function startTimer() {
    clearInterval(timerInterval);
    timeRemaining = 7200; // 120 mins
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        submitExam();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    examTimer.textContent = `⏱ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function renderQuestion() {
    if (currentQuestions.length === 0) {
      qTitle.textContent = 'No questions found for the selected filter.';
      optionsList.innerHTML = '';
      explanationBox.classList.add('hidden');
      return;
    }

    const q = currentQuestions[currentIndex];
    
    // Update Jump Select sync
    if (questionJumpSelect) {
      questionJumpSelect.value = currentIndex;
    }

    // Update Meta Badges
    qDomainBadge.textContent = q.domain.split(':')[0];
    qCaseBadge.textContent = q.caseStudy || 'General';
    qTopicBadge.textContent = q.topic;
    qTitle.textContent = `${currentIndex + 1}. ${q.question}`;
    
    // Progress
    questionProgress.textContent = `Question ${currentIndex + 1} of ${currentQuestions.length}`;
    
    // Options
    optionsList.innerHTML = '';
    explanationBox.classList.add('hidden');

    q.options.forEach(opt => {
      const optKey = opt.charAt(0);
      const optBtn = document.createElement('button');
      optBtn.className = 'option-btn';
      optBtn.textContent = opt;

      const answered = userAnswers[q.id];

      if (answered) {
        if (optKey === q.correctAnswer) {
          optBtn.classList.add('correct');
        } else if (optKey === answered) {
          optBtn.classList.add('incorrect');
        }
        optBtn.disabled = true;
      } else if (userAnswers[`${q.id}_selected`] === optKey) {
        optBtn.classList.add('selected');
      }

      optBtn.addEventListener('click', () => {
        if (userAnswers[q.id]) return; // Already checked
        userAnswers[`${q.id}_selected`] = optKey;
        
        // Remove previous selected
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        optBtn.classList.add('selected');

        if (!isExamMode) {
          checkAnswer(optKey);
        }
      });

      optionsList.appendChild(optBtn);
    });

    // Handle Practice Mode Explanation
    if (!isExamMode && userAnswers[q.id]) {
      showExplanation(q);
    }

    // Render Palette Status Grid
    renderPaletteGrid();

    // Navigation buttons state
    btnPrev.disabled = currentIndex === 0;
    
    if (currentIndex === currentQuestions.length - 1) {
      btnNext.textContent = isExamMode ? 'Submit Exam' : 'Finish Practice';
    } else {
      btnNext.textContent = 'Next →';
    }
  }

  function checkAnswer(selectedOpt) {
    const q = currentQuestions[currentIndex];
    userAnswers[q.id] = selectedOpt;

    // Refresh display
    renderQuestion();
  }

  function showExplanation(q) {
    explanationBox.classList.remove('hidden');
    expCorrectText.textContent = `Correct Answer (${q.correctAnswer}): ${q.explanation}`;
    
    let distractorsHTML = '<p style="margin-top:12px; font-weight:600;">Distractor Rationale:</p><ul style="padding-left:20px; font-size:0.88rem; margin-top:6px;">';
    for (const [key, text] of Object.entries(q.distractors || {})) {
      if (key !== q.correctAnswer) {
        distractorsHTML += `<li><strong>Option ${key}:</strong> ${text}</li>`;
      }
    }
    distractorsHTML += '</ul>';
    expDistractorsList.innerHTML = distractorsHTML;
  }

  btnPrev.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentIndex < currentQuestions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      submitExam();
    }
  });

  function submitExam() {
    clearInterval(timerInterval);
    questionContainer.classList.add('hidden');
    examResults.classList.remove('hidden');

    let correctCount = 0;
    currentQuestions.forEach(q => {
      const ans = userAnswers[q.id] || userAnswers[`${q.id}_selected`];
      if (ans === q.correctAnswer) {
        correctCount++;
      }
    });

    const total = currentQuestions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    document.getElementById('res-total').textContent = total;
    document.getElementById('res-correct').textContent = correctCount;
    document.getElementById('res-incorrect').textContent = total - correctCount;
    document.getElementById('score-percentage').textContent = `${percentage}%`;

    const verdictEl = document.getElementById('res-verdict');
    if (percentage >= 70) {
      verdictEl.textContent = 'PASSING GRADE (Target Met!)';
      verdictEl.style.background = 'var(--success-light)';
      verdictEl.style.color = 'var(--success)';
    } else {
      verdictEl.textContent = 'NEEDS REVIEW (Target: 70%)';
      verdictEl.style.background = 'var(--danger-light)';
      verdictEl.style.color = 'var(--danger)';
    }
  }

  btnRestart.addEventListener('click', () => {
    filterQuestions();
  });
});

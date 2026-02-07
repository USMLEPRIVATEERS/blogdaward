// ============================================
// WARD ACADEMY - SELF ASSESSMENT TEST
// Block-based test with 50 questions per block
// 75 minutes per block, 15 min break
// ============================================

let currentUser = null;
let enrollmentId = null;
let enrollmentData = null;
let assessmentData = null;
let allQuestions = [];
let blockQuestions = [];  // Questions for current block
let currentBlock = 1;
let totalBlocks = 1;
let questionsPerBlock = 50;
let timePerBlockMinutes = 75;
let breakTimeMinutes = 15;
let currentQuestionIndex = 0;
let userAnswers = {};  // {questionId: {answer, isCorrect, flagged}}
let currentAttempt = null;

// Timer variables
let blockTimeRemaining = 0;  // in seconds
let breakTimeRemaining = 0;  // in seconds
let timerInterval = null;
let isInBreak = false;

// Scheduling variables
let lateMinutes = 0;  // How many minutes late the user is

// Review mode variables
let isReviewMode = false;
let reviewResponses = {};  // {questionId: {selected_answer, is_correct}}

// Wait for Supabase to be ready
async function ensureSupabase() {
    if (window.supabase && window.supabase.from) return;
    // Wait for app.js proxy to initialize
    let attempts = 0;
    while ((!window.supabase || !window.supabase.from) && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    if (!window.supabase || !window.supabase.from) {
        throw new Error('App not initialized');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureSupabase();
        await checkAuth();
        const canContinue = await loadEnrollmentData();
        if (canContinue === false) return;
        await initializeTest();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar teste', 'error');
    }
});

// Check authentication
async function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('ward_user'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Load enrollment data
async function loadEnrollmentData() {
    const urlParams = new URLSearchParams(window.location.search);
    enrollmentId = urlParams.get('enrollment_id');
    isReviewMode = urlParams.get('review') === 'true';

    if (!enrollmentId) {
        showToast('Inscricao nao encontrada', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
        return false;
    }

    showLoading();

    try {
        // Load enrollment with assessment data
        const { data: enrollment, error: enrollmentError } = await window.supabase
            .from('self_assessment_enrollments')
            .select(`
                *,
                self_assessments(*)
            `)
            .eq('id', enrollmentId)
            .eq('user_id', currentUser.id)
            .single();

        if (enrollmentError || !enrollment) {
            throw new Error('Enrollment not found');
        }

        enrollmentData = enrollment;
        assessmentData = enrollment.self_assessments;

        // Calculate blocks
        questionsPerBlock = assessmentData.questions_per_block || 50;
        timePerBlockMinutes = assessmentData.time_per_block_minutes || 75;
        breakTimeMinutes = assessmentData.break_time_minutes || 15;
        totalBlocks = Math.ceil(assessmentData.total_questions / questionsPerBlock);

        // Check scheduled time and calculate lateness (skip in review mode and if already in progress)
        if (!isReviewMode && enrollmentData.scheduled_datetime_utc && enrollmentData.status !== 'in_progress') {
            const scheduledTime = new Date(enrollmentData.scheduled_datetime_utc);
            const now = new Date();
            const timeDiff = now - scheduledTime; // positive if late

            if (timeDiff > 0) {
                // User is late
                lateMinutes = Math.floor(timeDiff / (1000 * 60));

                // Check if too late (more than block time = exam lost)
                if (lateMinutes >= timePerBlockMinutes) {
                    hideLoading();
                    showToast('Prova perdida - voce nao compareceu no horario agendado', 'error');
                    setTimeout(() => window.location.href = 'dashboard-externo.html', 3000);
                    return false;
                }

                // Show late warning
                if (lateMinutes > 0) {
                    showToast(`Voce esta ${lateMinutes} minutos atrasado. O tempo sera descontado.`, 'warning');
                }
            } else if (timeDiff < -60000) { // More than 1 minute early
                // User is early - should not start yet
                hideLoading();
                showToast('A prova ainda nao comecou. Volte no horario agendado.', 'error');
                setTimeout(() => window.location.href = 'dashboard-externo.html', 3000);
                return false;
            }
        }

        // Note: total-questions is set later in loadBlockQuestions() after questions are loaded

    } catch (error) {
        console.error('Error loading enrollment:', error);
        hideLoading();
        showToast('Erro ao carregar inscricao', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
        return false;
    }
}

// Initialize test
async function initializeTest() {
    try {
        // Reset state for clean initialization
        userAnswers = {};
        currentQuestionIndex = 0;
        currentBlock = 1;
        currentAttempt = null;

        // Hide any overlays that might be visible from previous state
        const completionOverlay = document.getElementById('completion-overlay');
        const breakOverlay = document.getElementById('break-overlay');
        if (completionOverlay) completionOverlay.classList.remove('visible');
        if (breakOverlay) breakOverlay.classList.remove('visible');
        isInBreak = false;

        // Load all questions for this assessment
        const { data: questions, error: questionsError } = await window.supabase
            .from('self_assessment_questions')
            .select('*')
            .eq('self_assessment_id', assessmentData.id)
            .order('question_number', { ascending: true });

        if (questionsError) throw questionsError;

        allQuestions = questions || [];

        if (allQuestions.length === 0) {
            showToast('Nenhuma questao encontrada', 'error');
            setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
            return;
        }

        // If in review mode, load all responses and setup review UI
        if (isReviewMode) {
            await initializeReviewMode();
            return;
        }

        // Check if this is a fresh retake (enrollment reset but old attempts may exist)
        const isRetakeStart = enrollmentData.status === 'enrolled' &&
                              enrollmentData.retake_approved_at &&
                              !enrollmentData.started_at;

        // Load existing attempts to determine current block
        const { data: attempts, error: attemptsError } = await window.supabase
            .from('self_assessment_attempts')
            .select('*')
            .eq('enrollment_id', enrollmentId)
            .order('block_number', { ascending: true });

        if (attemptsError) throw attemptsError;

        // If this is a fresh retake, ignore old attempts and start fresh
        if (isRetakeStart) {
            console.log('Fresh retake detected - starting from block 1');

            // Delete any stale attempts that may exist
            if (attempts && attempts.length > 0) {
                console.log('Cleaning up stale attempts:', attempts.length);

                // Delete responses first
                for (const attempt of attempts) {
                    await window.supabase
                        .from('self_assessment_responses')
                        .delete()
                        .eq('attempt_id', attempt.id);
                }

                // Delete attempts
                await window.supabase
                    .from('self_assessment_attempts')
                    .delete()
                    .eq('enrollment_id', enrollmentId);
            }

            // Start fresh from block 1
            currentBlock = 1;
            await createNewAttempt();
        } else {
            // Normal flow - determine current block from existing attempts
            const completedBlocks = attempts?.filter(a => a.status === 'completed' || a.status === 'timed_out') || [];
            const inProgressAttempt = attempts?.find(a => a.status === 'in_progress');

            if (inProgressAttempt) {
                // Resume existing block
                currentBlock = inProgressAttempt.block_number;
                currentAttempt = inProgressAttempt;

                // Calculate remaining time
                const startedAt = new Date(inProgressAttempt.started_at);
                const elapsed = Math.floor((new Date() - startedAt) / 1000);
                blockTimeRemaining = Math.max(0, (timePerBlockMinutes * 60) - elapsed);

                // If time expired while page was away, auto-finish gracefully
                if (blockTimeRemaining <= 0) {
                    // Load responses so they count in the final results
                    await loadExistingResponses(inProgressAttempt.id);
                    loadBlockQuestions();
                    hideLoading();
                    showToast('O tempo do bloco expirou. Finalizando...', 'warning');
                    await new Promise(r => setTimeout(r, 1500));
                    await completeCurrentBlock('timed_out');
                    return;
                }

                // Load existing responses for this block
                await loadExistingResponses(inProgressAttempt.id);
            } else {
                // Start next block
                currentBlock = completedBlocks.length + 1;

                if (currentBlock > totalBlocks) {
                    // All blocks completed
                    completeAssessment();
                    return;
                }

                // Create new attempt
                await createNewAttempt();
            }
        }

        // Update enrollment status if needed
        if (enrollmentData.status === 'enrolled') {
            await window.supabase
                .from('self_assessment_enrollments')
                .update({
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .eq('id', enrollmentId);
        }

        // Load questions for current block
        loadBlockQuestions();

        // Start timer
        startBlockTimer();

        // Render UI
        renderQuestion();
        renderNavigation();

        hideLoading();
    } catch (error) {
        console.error('Error initializing test:', error);
        hideLoading();
        showToast('Erro ao iniciar teste', 'error');
    }
}

// Create new attempt for current block
async function createNewAttempt() {
    const { data: attempt, error } = await window.supabase
        .from('self_assessment_attempts')
        .insert({
            enrollment_id: enrollmentId,
            block_number: currentBlock,
            started_at: new Date().toISOString(),
            status: 'in_progress'
        })
        .select()
        .single();

    if (error) throw error;

    currentAttempt = attempt;

    // Calculate block time, deducting late minutes from first block only
    if (currentBlock === 1 && lateMinutes > 0) {
        blockTimeRemaining = Math.max(0, (timePerBlockMinutes - lateMinutes) * 60);
        console.log(`First block: deducting ${lateMinutes} minutes due to late arrival. Remaining: ${blockTimeRemaining}s`);
    } else {
        blockTimeRemaining = timePerBlockMinutes * 60;
    }
}

// Load existing responses
async function loadExistingResponses(attemptId) {
    const { data: responses, error } = await window.supabase
        .from('self_assessment_responses')
        .select('*')
        .eq('attempt_id', attemptId);

    if (error) throw error;

    responses?.forEach(response => {
        userAnswers[response.question_id] = {
            answer: response.selected_answer,
            isCorrect: response.is_correct,
            flagged: false
        };
    });
}

// Load questions for current block
function loadBlockQuestions() {
    const startIndex = (currentBlock - 1) * questionsPerBlock;
    const endIndex = Math.min(startIndex + questionsPerBlock, allQuestions.length);
    blockQuestions = allQuestions.slice(startIndex, endIndex);

    currentQuestionIndex = 0;

    // Update UI - total questions shows block questions count
    document.getElementById('total-questions').textContent = blockQuestions.length;
}

// Initialize review mode
async function initializeReviewMode() {
    try {
        // Load all responses for this enrollment
        const { data: responses, error } = await window.supabase
            .from('self_assessment_responses')
            .select('*')
            .eq('enrollment_id', enrollmentId);

        if (error) throw error;

        // Build responses map
        responses?.forEach(response => {
            reviewResponses[response.question_id] = {
                selected_answer: response.selected_answer,
                is_correct: response.is_correct
            };
        });

        // Use all questions (not just one block)
        blockQuestions = allQuestions;
        currentQuestionIndex = 0;

        // Update UI for review mode
        document.getElementById('total-questions').textContent = allQuestions.length;

        // Hide timer and show review banner
        const timerContainer = document.querySelector('.timer-container');
        if (timerContainer) timerContainer.style.display = 'none';

        const timedBadge = document.querySelector('.timed-badge');
        if (timedBadge) timedBadge.textContent = 'REVIEW MODE';

        // Hide end block button, mark checkbox
        const endBlockBtn = document.getElementById('btn-end-block');
        if (endBlockBtn) endBlockBtn.style.display = 'none';

        const markContainer = document.querySelector('.mark-container');
        if (markContainer) markContainer.style.display = 'none';

        // Show exit review button in footer
        const exitReviewBtn = document.getElementById('btn-exit-review-footer');
        console.log('Exit review button found:', exitReviewBtn);
        if (exitReviewBtn) {
            exitReviewBtn.style.display = 'flex';
            exitReviewBtn.style.visibility = 'visible';
            console.log('Exit button display set to flex');
        } else {
            console.error('Exit review button not found!');
        }

        // Update block indicator
        const blockIndicator = document.getElementById('block-indicator');
        if (blockIndicator) blockIndicator.textContent = 'Review';

        // Render first question
        renderQuestion();
        renderNavigation();

        hideLoading();
    } catch (error) {
        console.error('Error initializing review mode:', error);
        hideLoading();
        showToast('Erro ao carregar modo de revisao', 'error');
    }
}

// Start block timer
function startBlockTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (isInBreak) {
            breakTimeRemaining--;
            updateBreakTimerDisplay();

            if (breakTimeRemaining <= 0) {
                // Break time ended, force start next block
                startNextBlock();
            }
        } else {
            blockTimeRemaining--;
            updateTimerDisplay();

            if (blockTimeRemaining <= 0) {
                // Time's up, auto-finish block
                autoFinishBlock();
            }
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const hours = Math.floor(blockTimeRemaining / 3600);
    const minutes = Math.floor((blockTimeRemaining % 3600) / 60);
    const seconds = blockTimeRemaining % 60;
    const timerEl = document.getElementById('timer');

    timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Add warning classes
    if (blockTimeRemaining <= 60) {
        timerEl.className = 'timer danger';
    } else if (blockTimeRemaining <= 300) {
        timerEl.className = 'timer warning';
    } else {
        timerEl.className = 'timer';
    }
}

// Update break timer display
function updateBreakTimerDisplay() {
    const minutes = Math.floor(breakTimeRemaining / 60);
    const seconds = breakTimeRemaining % 60;
    document.getElementById('break-timer').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Render navigation
function renderNavigation() {
    const nav = document.getElementById('question-nav');

    nav.innerHTML = blockQuestions.map((q, index) => {
        const isCurrent = index === currentQuestionIndex;
        const userAnswer = userAnswers[q.id];
        const isAnswered = userAnswer?.answer !== undefined && userAnswer?.answer !== null;
        const isFlagged = userAnswer?.flagged;

        let className = 'question-nav-item';
        if (isCurrent) {
            className += ' current';
        }
        if (isFlagged) {
            className += ' flagged';
        }
        if (isAnswered) {
            className += ' answered';
        }

        return `
            <div class="${className}" onclick="goToQuestion(${index})">
                <div class="question-status-dot"></div>
                <span class="question-nav-number">${index + 1}</span>
                <span class="question-nav-flag">&#9873;</span>
            </div>
        `;
    }).join('');
}

// Render current question
function renderQuestion() {
    const question = blockQuestions[currentQuestionIndex];
    if (!question) return;

    // Update question number
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;

    // Update question ID
    const questionIdEl = document.getElementById('question-id');
    if (questionIdEl) {
        questionIdEl.textContent = question.question_number || question.id;
    }

    // Update figure button
    updateFigureButton();

    // Update tags (hidden in USMLE style but still populated)
    document.getElementById('question-tags').textContent =
        question.question_tags?.replace(/::/g, ' > ') || '';

    // Update question text
    document.getElementById('question-text').textContent = question.question;

    // Render choices - USMLE style with radio buttons and strikethrough
    const choices = question.choices;
    const choicesList = document.getElementById('choices-list');
    const userAnswer = userAnswers[question.id];
    const reviewAnswer = isReviewMode ? reviewResponses[question.id] : null;
    const questionStrikethroughs = strikethroughAnswers[question.id] || {};

    choicesList.innerHTML = choices.map((choice, index) => {
        // Generate letter dynamically (A=65 in ASCII)
        const letter = String.fromCharCode(65 + index);
        const isSelected = reviewAnswer ? reviewAnswer.selected_answer === letter : (userAnswer && userAnswer.answer === letter);
        const isCorrect = letter === question.correct_answer;
        const isStrikethrough = questionStrikethroughs[letter];

        let className = 'choice-item';
        if (isReviewMode) {
            className += ' review-mode';
            if (isCorrect) {
                className += ' correct';
            }
            if (isSelected && !isCorrect) {
                className += ' incorrect';
            }
            if (isSelected) {
                className += ' selected';
            }
        } else {
            if (isSelected) {
                className += ' selected';
            }
            if (isStrikethrough) {
                className += ' strikethrough';
            }
        }

        const clickHandler = isReviewMode ? '' : `onclick="selectAnswer('${letter}')"`;
        const strikethroughBtn = isReviewMode ? '' : `<button class="strikethrough-btn" onclick="toggleStrikethrough(event, '${letter}')" title="Riscar opcao">&#10006;</button>`;

        return `
            <div class="${className}" ${clickHandler}>
                <div class="choice-radio"></div>
                <span class="choice-letter">${letter}.</span>
                <span class="choice-text">${choice.replace(/^[A-E]\.\s*/, '')}</span>
                ${isReviewMode && isCorrect ? '<span class="choice-correct-badge">&#10003; Correta</span>' : ''}
                ${isReviewMode && isSelected && !isCorrect ? '<span class="choice-incorrect-badge">&#10007; Sua resposta</span>' : ''}
                ${strikethroughBtn}
            </div>
        `;
    }).join('');

    // Show explanation in review mode
    const explanationEl = document.getElementById('question-explanation');
    if (explanationEl) {
        if (isReviewMode && question.explanation) {
            explanationEl.style.display = 'block';
            // Convert line breaks to <br> tags for proper display
            const formattedExplanation = question.explanation.replace(/\n/g, '<br>');
            explanationEl.innerHTML = `<strong>Explicacao:</strong><br>${formattedExplanation}`;
        } else {
            explanationEl.style.display = 'none';
        }
    }

    // Update mark checkbox and flag icon
    const markCheckbox = document.getElementById('mark-checkbox');
    const markFlag = document.getElementById('mark-flag');
    const isFlagged = userAnswer?.flagged || false;

    if (markCheckbox) {
        markCheckbox.checked = isFlagged;
    }
    if (markFlag) {
        if (isFlagged) {
            markFlag.classList.remove('inactive');
        } else {
            markFlag.classList.add('inactive');
        }
    }

    // Update navigation buttons
    document.getElementById('btn-previous').disabled = currentQuestionIndex === 0;
    document.getElementById('btn-next').disabled = currentQuestionIndex === blockQuestions.length - 1;
}

// Select answer
async function selectAnswer(letter) {
    const question = blockQuestions[currentQuestionIndex];
    const isCorrect = letter === question.correct_answer;

    // Check if already answered
    const existingAnswer = userAnswers[question.id];

    if (existingAnswer) {
        // Update existing answer
        userAnswers[question.id].answer = letter;
        userAnswers[question.id].isCorrect = isCorrect;

        // Update in database
        await window.supabase
            .from('self_assessment_responses')
            .update({
                selected_answer: letter,
                is_correct: isCorrect,
                answered_at: new Date().toISOString()
            })
            .eq('enrollment_id', enrollmentId)
            .eq('question_id', question.id);
    } else {
        // New answer
        userAnswers[question.id] = {
            answer: letter,
            isCorrect: isCorrect,
            flagged: false
        };

        // Save to database
        await window.supabase
            .from('self_assessment_responses')
            .insert({
                enrollment_id: enrollmentId,
                attempt_id: currentAttempt.id,
                question_id: question.id,
                selected_answer: letter,
                is_correct: isCorrect
            });
    }

    // Re-render
    renderQuestion();
    renderNavigation();
}

// Toggle flag
function toggleFlag() {
    const question = blockQuestions[currentQuestionIndex];

    if (!userAnswers[question.id]) {
        userAnswers[question.id] = {
            answer: null,
            isCorrect: false,
            flagged: true
        };
    } else {
        userAnswers[question.id].flagged = !userAnswers[question.id].flagged;
    }

    renderQuestion();
    renderNavigation();
}

// Navigation functions
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        renderNavigation();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < blockQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
        renderNavigation();
    }
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    renderQuestion();
    renderNavigation();
}

// Finish block manually
async function finishBlock() {
    const answeredCount = blockQuestions.filter(q => userAnswers[q.id]?.answer).length;
    const totalCount = blockQuestions.length;

    if (answeredCount < totalCount) {
        if (!confirm(`Voce respondeu ${answeredCount} de ${totalCount} questoes. Deseja finalizar mesmo assim?`)) {
            return;
        }
    }

    await completeCurrentBlock();
}

// Auto-finish when time runs out
async function autoFinishBlock() {
    showToast('Tempo esgotado! Finalizando bloco...', 'warning');
    await completeCurrentBlock('timed_out');
}

// Complete current block
async function completeCurrentBlock(status = 'completed') {
    clearInterval(timerInterval);

    // Calculate results for this block
    const correctCount = blockQuestions.filter(q =>
        userAnswers[q.id]?.isCorrect
    ).length;

    const answeredCount = blockQuestions.filter(q =>
        userAnswers[q.id]?.answer
    ).length;

    // Update attempt
    await window.supabase
        .from('self_assessment_attempts')
        .update({
            finished_at: new Date().toISOString(),
            status: status,
            questions_answered: answeredCount,
            correct_answers: correctCount,
            time_spent_seconds: (timePerBlockMinutes * 60) - blockTimeRemaining
        })
        .eq('id', currentAttempt.id);

    // Check if this was the last block
    if (currentBlock >= totalBlocks) {
        completeAssessment();
    } else {
        // Show break screen
        showBreakScreen();
    }
}

// Show break screen
function showBreakScreen() {
    isInBreak = true;
    breakTimeRemaining = breakTimeMinutes * 60;

    document.getElementById('completed-block').textContent = currentBlock;
    document.getElementById('break-overlay').classList.add('visible');

    updateBreakTimerDisplay();
    startBlockTimer();
}

// Start next block
async function startNextBlock() {
    isInBreak = false;
    document.getElementById('break-overlay').classList.remove('visible');

    clearInterval(timerInterval);

    currentBlock++;

    if (currentBlock > totalBlocks) {
        completeAssessment();
        return;
    }

    // Reset answers for new block
    userAnswers = {};

    // Create new attempt
    await createNewAttempt();

    // Load questions for new block
    loadBlockQuestions();

    // Start timer
    startBlockTimer();

    // Render UI
    renderQuestion();
    renderNavigation();
}

// Complete assessment
async function completeAssessment() {
    clearInterval(timerInterval);

    // Update enrollment status
    await window.supabase
        .from('self_assessment_enrollments')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

    // Show completion screen
    document.getElementById('completion-overlay').classList.add('visible');
}

// Prevent accidental page leave
window.addEventListener('beforeunload', (e) => {
    if (!isInBreak && blockTimeRemaining > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============================================
// FIGURE MODAL FUNCTIONALITY
// ============================================

let currentFigures = [];
let currentFigureIndex = 0;

// Update figure button visibility based on question
function updateFigureButton() {
    const question = blockQuestions[currentQuestionIndex];
    const btnShowFigures = document.getElementById('btn-show-figures');
    const btnToolbarFigures = document.getElementById('btn-show-figures-toolbar');

    if (question && question.figures && question.figures.trim() !== '') {
        // Parse figures (comma separated, with or without spaces)
        currentFigures = question.figures.split(',').map(url => url.trim()).filter(url => url);
        console.log('Figures found:', currentFigures.length, currentFigures);

        if (currentFigures.length > 0) {
            btnShowFigures.classList.add('visible');
            if (btnToolbarFigures) btnToolbarFigures.style.display = 'flex';
            // Update button text based on count
            if (currentFigures.length === 1) {
                btnShowFigures.innerHTML = '🖼️ Show Figure';
            } else {
                btnShowFigures.innerHTML = `🖼️ Show Figures (${currentFigures.length})`;
            }
        } else {
            btnShowFigures.classList.remove('visible');
            if (btnToolbarFigures) btnToolbarFigures.style.display = 'none';
        }
    } else {
        currentFigures = [];
        btnShowFigures.classList.remove('visible');
        if (btnToolbarFigures) btnToolbarFigures.style.display = 'none';
    }
}

// Toggle full screen mode
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Open figure modal
function openFigureModal() {
    if (currentFigures.length === 0) return;

    currentFigureIndex = 0;
    showFigure();
    document.getElementById('figure-modal').classList.add('visible');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Close figure modal
function closeFigureModal() {
    document.getElementById('figure-modal').classList.remove('visible');
    document.body.style.overflow = '';
}

// Navigate between figures
function navigateFigure(direction) {
    currentFigureIndex += direction;

    // Clamp to valid range
    if (currentFigureIndex < 0) currentFigureIndex = 0;
    if (currentFigureIndex >= currentFigures.length) currentFigureIndex = currentFigures.length - 1;

    showFigure();
}

// Show current figure
function showFigure() {
    const imgEl = document.getElementById('figure-image');
    const counterEl = document.getElementById('figure-counter');
    const prevBtn = document.getElementById('figure-prev');
    const nextBtn = document.getElementById('figure-next');
    const loadingEl = document.getElementById('figure-loading');

    // Show loading
    if (loadingEl) loadingEl.style.display = 'flex';
    imgEl.style.opacity = '0.3';

    // Set image source
    imgEl.onload = () => {
        if (loadingEl) loadingEl.style.display = 'none';
        imgEl.style.opacity = '1';
    };
    imgEl.onerror = () => {
        if (loadingEl) loadingEl.style.display = 'none';
        imgEl.style.opacity = '1';
    };
    imgEl.src = currentFigures[currentFigureIndex];

    // Update counter
    counterEl.textContent = `${currentFigureIndex + 1} / ${currentFigures.length}`;

    // Update navigation buttons
    prevBtn.disabled = currentFigureIndex === 0;
    nextBtn.disabled = currentFigureIndex === currentFigures.length - 1;

    // Hide navigation if only one figure
    if (currentFigures.length <= 1) {
        prevBtn.style.visibility = 'hidden';
        nextBtn.style.visibility = 'hidden';
        counterEl.style.display = 'none';
    } else {
        prevBtn.style.visibility = 'visible';
        nextBtn.style.visibility = 'visible';
        counterEl.style.display = 'block';
    }
}

// Close modal on background click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('figure-modal');
    if (e.target === modal) {
        closeFigureModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFigureModal();
        closeSidebar();
    }
    // Navigate figures with arrow keys
    const modal = document.getElementById('figure-modal');
    if (modal.classList.contains('visible')) {
        if (e.key === 'ArrowLeft') {
            navigateFigure(-1);
        } else if (e.key === 'ArrowRight') {
            navigateFigure(1);
        }
    }
});

// ============================================
// SIDEBAR (HAMBURGER MENU) FUNCTIONALITY
// ============================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // Toggle hidden class (sidebar is visible by default)
    sidebar.classList.toggle('hidden');

    // Only show overlay on mobile when sidebar is visible
    if (!sidebar.classList.contains('hidden') && window.innerWidth <= 768) {
        overlay.classList.add('visible');
    } else {
        overlay.classList.remove('visible');
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    sidebar.classList.add('hidden');
    overlay.classList.remove('visible');
}

// ============================================
// STRIKETHROUGH FUNCTIONALITY
// ============================================

let strikethroughAnswers = {}; // {questionId: {A: true, B: false, ...}}

function toggleStrikethrough(event, letter) {
    event.stopPropagation(); // Don't select the answer

    const question = blockQuestions[currentQuestionIndex];

    if (!strikethroughAnswers[question.id]) {
        strikethroughAnswers[question.id] = {};
    }

    strikethroughAnswers[question.id][letter] = !strikethroughAnswers[question.id][letter];

    renderQuestion();
}

// ============================================
// TEXT HIGHLIGHTING FUNCTIONALITY
// ============================================

let selectedRange = null;
let highlightedTexts = {}; // {questionId: [{start, end, text}]}

// Show highlight toolbar when text is selected
document.addEventListener('mouseup', (e) => {
    const questionText = document.getElementById('question-text');
    const toolbar = document.getElementById('highlight-toolbar');

    if (!questionText || !toolbar) return;

    const selection = window.getSelection();

    if (selection.rangeCount > 0 && selection.toString().trim().length > 0) {
        // Check if selection is within question text
        const range = selection.getRangeAt(0);
        if (questionText.contains(range.commonAncestorContainer)) {
            selectedRange = range.cloneRange();

            // Position toolbar near selection
            const rect = range.getBoundingClientRect();
            toolbar.style.top = (rect.top - 45 + window.scrollY) + 'px';
            toolbar.style.left = (rect.left + (rect.width / 2) - 75) + 'px';
            toolbar.classList.add('visible');
        }
    } else {
        // Hide toolbar if clicking outside
        if (!toolbar.contains(e.target)) {
            toolbar.classList.remove('visible');
            selectedRange = null;
        }
    }
});

function applyHighlight() {
    if (!selectedRange) return;

    const question = blockQuestions[currentQuestionIndex];
    const span = document.createElement('span');
    span.className = 'highlight';

    try {
        selectedRange.surroundContents(span);
    } catch (e) {
        // Handle complex selections
        console.log('Complex selection, using alternative method');
        const selectedText = selectedRange.toString();
        const questionTextEl = document.getElementById('question-text');
        questionTextEl.innerHTML = questionTextEl.innerHTML.replace(
            selectedText,
            `<span class="highlight">${selectedText}</span>`
        );
    }

    // Store highlight for this question
    if (!highlightedTexts[question.id]) {
        highlightedTexts[question.id] = [];
    }
    highlightedTexts[question.id].push(selectedRange.toString());

    // Clear selection and hide toolbar
    window.getSelection().removeAllRanges();
    document.getElementById('highlight-toolbar').classList.remove('visible');
    selectedRange = null;
}

function removeHighlight() {
    const questionTextEl = document.getElementById('question-text');
    const highlights = questionTextEl.querySelectorAll('.highlight');

    highlights.forEach(h => {
        const text = h.textContent;
        h.replaceWith(text);
    });

    // Clear stored highlights for this question
    const question = blockQuestions[currentQuestionIndex];
    highlightedTexts[question.id] = [];

    // Hide toolbar
    document.getElementById('highlight-toolbar').classList.remove('visible');
    selectedRange = null;
}

// ============================================
// EXIT REVIEW MODE
// ============================================

function exitReview() {
    // Navigate back to results page with the same enrollment_id
    window.location.href = `self-assessment-results.html?enrollment_id=${enrollmentId}`;
}

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

// Wait for Supabase to be ready
async function ensureSupabase() {
    if (window.supabase && typeof window.supabase.auth !== 'undefined') {
        return;
    }

    let attempts = 0;
    while (typeof window.supabase?.createClient !== 'function' && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
    }

    if (typeof window.supabase?.createClient !== 'function') {
        throw new Error('Supabase library not loaded');
    }

    if (!window.supabase.auth) {
        const SUPABASE_URL = 'https://yxtdesthusclivjdewfl.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGRlc3RodXNjbGl2amRld2ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDUzMzYsImV4cCI6MjA4MjcyMTMzNn0.OQgK2s8K7CKJKyIwx7I6jnExTdCBpgiM7KfZuqhbPbw';
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ensureSupabase();
        await checkAuth();
        await loadEnrollmentData();
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

    if (!enrollmentId) {
        showToast('Inscricao nao encontrada', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
        return;
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

        // Check scheduled time and calculate lateness
        if (enrollmentData.scheduled_datetime_utc) {
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
                    return;
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
                return;
            }
        }

        // Update UI
        document.getElementById('total-blocks').textContent = totalBlocks;
        document.getElementById('total-blocks-display').textContent = totalBlocks;

    } catch (error) {
        console.error('Error loading enrollment:', error);
        hideLoading();
        showToast('Erro ao carregar inscricao', 'error');
        setTimeout(() => window.location.href = 'dashboard-externo.html', 2000);
    }
}

// Initialize test
async function initializeTest() {
    try {
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

        // Load existing attempts to determine current block
        const { data: attempts, error: attemptsError } = await window.supabase
            .from('self_assessment_attempts')
            .select('*')
            .eq('enrollment_id', enrollmentId)
            .order('block_number', { ascending: true });

        if (attemptsError) throw attemptsError;

        // Determine current block
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

    // Update UI
    document.getElementById('current-block').textContent = currentBlock;
    document.getElementById('block-number-display').textContent = currentBlock;
    document.getElementById('total-questions').textContent = blockQuestions.length;
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
    const minutes = Math.floor(blockTimeRemaining / 60);
    const seconds = blockTimeRemaining % 60;
    const timerEl = document.getElementById('timer');

    timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Add warning classes
    if (blockTimeRemaining <= 60) {
        timerEl.className = 'info-value timer danger';
    } else if (blockTimeRemaining <= 300) {
        timerEl.className = 'info-value timer warning';
    } else {
        timerEl.className = 'info-value timer';
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
        const isAnswered = userAnswer !== undefined;
        const isFlagged = userAnswer?.flagged;

        let className = 'question-nav-btn';
        if (isCurrent) {
            className += ' current';
        } else if (isFlagged) {
            className += ' flagged';
        } else if (isAnswered) {
            className += ' answered';
        }

        return `
            <button class="${className}" onclick="goToQuestion(${index})">
                ${index + 1}
            </button>
        `;
    }).join('');
}

// Render current question
function renderQuestion() {
    const question = blockQuestions[currentQuestionIndex];
    if (!question) return;

    // Update question number
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;

    // Update tags
    document.getElementById('question-tags').textContent =
        question.question_tags?.replace(/::/g, ' > ') || '';

    // Update question text
    document.getElementById('question-text').textContent = question.question;

    // Render choices
    const choices = question.choices;
    const choicesList = document.getElementById('choices-list');
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const userAnswer = userAnswers[question.id];

    choicesList.innerHTML = choices.map((choice, index) => {
        const letter = letters[index];
        const isSelected = userAnswer && userAnswer.answer === letter;

        let className = 'choice-item';
        if (isSelected) {
            className += ' selected';
        }

        return `
            <div class="${className}" onclick="selectAnswer('${letter}')">
                <div class="choice-letter">${letter}</div>
                <div class="choice-text">${choice.replace(/^[A-E]\.\s*/, '')}</div>
            </div>
        `;
    }).join('');

    // Update flag button
    const btnFlag = document.getElementById('btn-flag');
    if (userAnswer?.flagged) {
        btnFlag.classList.add('flagged');
        btnFlag.textContent = '🚩 Marcada';
    } else {
        btnFlag.classList.remove('flagged');
        btnFlag.textContent = '🚩 Marcar para Revisao';
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

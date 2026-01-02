// ============================================
// FLASH QUESTIONS TEST
// ============================================

let testData = null;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let startTime = null;
let timerInterval = null;
let testId = null;

// Wait for Supabase to be ready
async function ensureSupabase() {
    // If already initialized, return
    if (window.supabase && typeof window.supabase.auth !== 'undefined') {
        return;
    }

    // Wait for library to load
    let attempts = 0;
    while (typeof window.supabase?.createClient !== 'function' && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
        }

    // If still not loaded, throw error
    if (typeof window.supabase?.createClient !== 'function') {
        throw new Error('Supabase library not loaded');
    }

    // Initialize if not already done
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
        await loadTest();
        startTimer();
        renderQuestion();
        renderNavigation();
    } catch (error) {
        console.error('Error initializing:', error);
        showToast('Erro ao carregar teste', 'error');
    }
});

// Check authentication
async function checkAuth() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) {
        if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
        return null;
    }
    return user;
}

// Load test data
async function loadTest() {
    const urlParams = new URLSearchParams(window.location.search);
    testId = urlParams.get('test_id');

    if (!testId) {
        showToast('Teste não encontrado', 'error');
        setTimeout(() => window.location.href = 'flash-questions-dashboard.html', 2000);
        return;
    }

    try {
        // Load test record
        const { data: test, error: testError } = await window.supabase
            .from('flash_tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (testError) throw testError;

        testData = test;
        startTime = new Date(test.started_at);

        // Load questions
        const { data: questionsData, error: questionsError } = await window.supabase
            .from('flash_questions')
            .select('*')
            .in('question_id', test.question_ids);

        if (questionsError) throw questionsError;

        // Sort questions in the order specified by test.question_ids
        questions = test.question_ids.map(id =>
            questionsData.find(q => q.question_id === id)
        ).filter(q => q != null);

        // Update UI
        document.getElementById('total-questions').textContent = questions.length;

        // Load existing responses if any
        await loadExistingResponses();

    } catch (error) {
        console.error('Error loading test:', error);
        showToast('Erro ao carregar teste', 'error');
    }
}

// Load existing responses
async function loadExistingResponses() {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    try {
        const { data: responses, error } = await window.supabase
            .from('flash_question_responses')
            .select('*')
            .eq('test_id', testId)
            .eq('user_id', user.id);

        if (error) throw error;

        // Map responses to userAnswers
        responses.forEach(response => {
            const questionIndex = questions.findIndex(q => q.question_id === response.question_id);
            if (questionIndex !== -1) {
                userAnswers[questionIndex] = {
                    answer: response.selected_answer,
                    isCorrect: response.is_correct,
                    shown: true
                };
            }
        });

    } catch (error) {
        console.error('Error loading responses:', error);
    }
}

// Start timer
function startTimer() {
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// Update timer
function updateTimer() {
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const timeStr = hours > 0
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('timer').textContent = timeStr;
}

// Render navigation
function renderNavigation() {
    const nav = document.getElementById('question-nav');

    nav.innerHTML = questions.map((q, index) => {
        const isCurrent = index === currentQuestionIndex;
        const userAnswer = userAnswers[index];
        const isAnswered = userAnswer !== undefined;

        let className = 'question-nav-btn';
        if (isCurrent) {
            className += ' current';
        } else if (isAnswered) {
            // Show green for correct, red for incorrect
            if (userAnswer.isCorrect) {
                className += ' correct';
            } else {
                className += ' incorrect';
            }
        }

        return `
            <button class="${className}" onclick="goToQuestion(${index})">
                ${index + 1}
            </button>
        `;
    }).join('');
}

// Render current question
async function renderQuestion() {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    // Update question number
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;

    // Update tags
    document.getElementById('question-tags').textContent = question.question_tags.replace(/::/g, ' > ');

    // Update question text
    document.getElementById('question-text').textContent = question.question;

    // Render choices (Supabase JSONB is already parsed)
    const choices = question.choices;
    const choicesList = document.getElementById('choices-list');

    const letters = ['A', 'B', 'C', 'D', 'E'];
    const userAnswer = userAnswers[currentQuestionIndex];

    choicesList.innerHTML = choices.map((choice, index) => {
        const letter = letters[index];
        const isSelected = userAnswer && userAnswer.answer === letter;
        const isCorrect = letter === question.correct_answer;
        const showAnswer = userAnswer && userAnswer.shown;

        let className = 'choice-item';
        if (showAnswer) {
            if (isCorrect) {
                className += ' correct';
            } else if (isSelected && !isCorrect) {
                className += ' incorrect';
            }
        } else if (isSelected) {
            className += ' selected';
        }

        // Get percentage if answer is shown
        let percentageHtml = '';
        if (showAnswer) {
            percentageHtml = `<span class="choice-percentage" id="percentage-${letter}">-</span>`;
        }

        return `
            <div class="${className}" onclick="selectAnswer('${letter}')">
                <div class="choice-letter">${letter}</div>
                <div class="choice-text">${choice.replace(/^[A-E]\.\s*/, '')}</div>
                ${percentageHtml}
            </div>
        `;
    }).join('');

    // Show/hide answer button
    const btnShowAnswer = document.getElementById('btn-show-answer');
    const answerSection = document.getElementById('answer-section');

    if (userAnswer && userAnswer.answer) {
        btnShowAnswer.style.display = 'block';

        if (userAnswer.shown) {
            btnShowAnswer.style.display = 'none';
            answerSection.classList.add('visible');

            // Load explanation
            document.getElementById('explanation-text').textContent = question.explanation;

            // Load percentages
            await loadAnswerPercentages(question.question_id);

            // Load comments
            await loadComments(question.question_id);
        } else {
            answerSection.classList.remove('visible');
        }
    } else {
        btnShowAnswer.style.display = 'none';
        answerSection.classList.remove('visible');
    }

    // Update navigation buttons
    document.getElementById('btn-previous').disabled = currentQuestionIndex === 0;
    document.getElementById('btn-next').disabled = currentQuestionIndex === questions.length - 1;
}

// Select answer
async function selectAnswer(letter) {
    const userAnswer = userAnswers[currentQuestionIndex];

    // If answer already shown, don't allow changing
    if (userAnswer && userAnswer.shown) {
        return;
    }

    const question = questions[currentQuestionIndex];
    const isCorrect = letter === question.correct_answer;

    // Save answer
    userAnswers[currentQuestionIndex] = {
        answer: letter,
        isCorrect: isCorrect,
        shown: false
    };

    // Save to database
    await saveResponse(question.question_id, letter, isCorrect);

    // Re-render
    renderQuestion();
    renderNavigation();
}

// Save response to database
async function saveResponse(questionId, selectedAnswer, isCorrect) {
    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    try {
        const { error } = await window.supabase
            .from('flash_question_responses')
            .insert({
                user_id: user.id,
                question_id: questionId,
                selected_answer: selectedAnswer,
                is_correct: isCorrect,
                test_id: testId
            });

        if (error) throw error;

        // Update test record
        const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
        const incorrectCount = Object.values(userAnswers).filter(a => !a.isCorrect).length;

        await window.supabase
            .from('flash_tests')
            .update({
                correct_answers: correctCount,
                incorrect_answers: incorrectCount
            })
            .eq('id', testId);

    } catch (error) {
        console.error('Error saving response:', error);
        showToast('Erro ao salvar resposta', 'error');
    }
}

// Show answer
function showAnswer() {
    if (!userAnswers[currentQuestionIndex]) return;

    userAnswers[currentQuestionIndex].shown = true;
    renderQuestion();
}

// Load answer percentages
async function loadAnswerPercentages(questionId) {
    try {
        const { data: stats, error } = await window.supabase
            .from('flash_question_stats')
            .select('*')
            .eq('question_id', questionId)
            .single();

        if (error) throw error;

        if (stats && stats.total_responses > 0) {
            const total = stats.total_responses;
            const letters = ['A', 'B', 'C', 'D', 'E'];
            const counts = [
                stats.option_a_count,
                stats.option_b_count,
                stats.option_c_count,
                stats.option_d_count,
                stats.option_e_count
            ];

            letters.forEach((letter, index) => {
                const element = document.getElementById(`percentage-${letter}`);
                if (element) {
                    const percentage = Math.round((counts[index] / total) * 100);
                    element.textContent = `${percentage}%`;
                }
            });
        }

    } catch (error) {
        console.error('Error loading percentages:', error);
    }
}

// Load comments
async function loadComments(questionId) {
    try {
        const { data: comments, error } = await window.supabase
            .from('flash_question_comments')
            .select(`
                *,
                users!user_id (name, full_name)
            `)
            .eq('question_id', questionId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const commentsList = document.getElementById('comments-list');

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<p style="color: #999;">Nenhum comentário ainda</p>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const date = new Date(comment.created_at);
            const dateStr = date.toLocaleDateString('pt-BR');
            const userName = comment.users?.name || comment.users?.full_name || 'Anônimo';

            return `
                <div class="comment-item">
                    <div class="comment-header">
                        <span><strong>${escapeHtml(userName)}</strong></span>
                        <span>${dateStr}</span>
                    </div>
                    <div class="comment-text">${escapeHtml(comment.comment)}</div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Add comment
async function addComment() {
    const input = document.getElementById('comment-input');
    const comment = input.value.trim();

    if (!comment) {
        showToast('Digite um comentário', 'error');
        return;
    }

    const user = JSON.parse(localStorage.getItem('ward_user'));
    if (!user) return;

    const question = questions[currentQuestionIndex];

    try {
        const { error } = await window.supabase
            .from('flash_question_comments')
            .insert({
                question_id: question.question_id,
                user_id: user.id,
                comment: comment
            });

        if (error) throw error;

        showToast('Comentário adicionado!', 'success');
        input.value = '';

        // Reload comments
        await loadComments(question.question_id);

    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Erro ao adicionar comentário', 'error');
    }
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
    if (currentQuestionIndex < questions.length - 1) {
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

// Pause test
async function pauseTest() {
    if (confirm('Deseja pausar o teste? Você poderá continuar depois.')) {
        clearInterval(timerInterval);

        await window.supabase
            .from('flash_tests')
            .update({ status: 'paused' })
            .eq('id', testId);

        window.location.href = 'flash-questions-dashboard.html';
    }
}

// Finish test
async function finishTest() {
    const answered = Object.keys(userAnswers).length;
    const total = questions.length;

    if (answered < total) {
        if (!confirm(`Você respondeu ${answered} de ${total} questões. Deseja finalizar mesmo assim?`)) {
            return;
        }
    }

    clearInterval(timerInterval);

    // Calculate results
    const correct = Object.values(userAnswers).filter(a => a.isCorrect).length;
    const incorrect = Object.values(userAnswers).filter(a => !a.isCorrect).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Update test record
    const now = new Date();
    const totalSeconds = Math.floor((now - startTime) / 1000);

    await window.supabase
        .from('flash_tests')
        .update({
            status: 'completed',
            completed_at: now.toISOString(),
            total_time_seconds: totalSeconds,
            correct_answers: correct,
            incorrect_answers: incorrect
        })
        .eq('id', testId);

    // Check if this is a retake and show comparison
    const { data: currentTest } = await window.supabase
        .from('flash_tests')
        .select('retake_of_test_id')
        .eq('id', testId)
        .single();

    let comparisonHTML = '';
    if (currentTest && currentTest.retake_of_test_id) {
        // Get original test results
        const { data: originalTest } = await window.supabase
            .from('flash_tests')
            .select('correct_answers, total_questions, completed_at')
            .eq('id', currentTest.retake_of_test_id)
            .single();

        if (originalTest) {
            const originalPercentage = Math.round((originalTest.correct_answers / originalTest.total_questions) * 100);
            const difference = percentage - originalPercentage;
            const improvement = difference > 0 ? 'progresso' : difference < 0 ? 'regresso' : 'igual';
            const arrow = difference > 0 ? '📈' : difference < 0 ? '📉' : '➡️';
            const color = difference > 0 ? '#22c55e' : difference < 0 ? '#ef4444' : '#6b7280';

            comparisonHTML = `
                <div style="margin-top: 2rem; padding: 1.5rem; background: #f9fafb; border-radius: 12px; border: 2px solid ${color};">
                    <h3 style="margin: 0 0 1rem 0; color: ${color}; display: flex; align-items: center; gap: 0.5rem;">
                        ${arrow} Comparação com Tentativa Anterior
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">Tentativa Anterior</div>
                            <div style="font-size: 2rem; font-weight: 700; color: #6b7280;">${originalPercentage}%</div>
                            <div style="font-size: 0.85rem; color: #999;">${originalTest.correct_answers}/${originalTest.total_questions} corretas</div>
                        </div>
                        <div>
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">Esta Tentativa</div>
                            <div style="font-size: 2rem; font-weight: 700; color: ${color};">${percentage}%</div>
                            <div style="font-size: 0.85rem; color: #999;">${correct}/${total} corretas</div>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: white; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.2rem; font-weight: 600; color: ${color};">
                            ${difference > 0 ? '+' : ''}${difference}% de ${improvement}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Show results
    document.getElementById('result-correct').textContent = correct;
    document.getElementById('result-incorrect').textContent = incorrect;
    document.getElementById('result-percentage').textContent = `${percentage}%`;

    // Add comparison if available
    const comparisonContainer = document.getElementById('comparison-container');
    if (comparisonContainer) {
        comparisonContainer.innerHTML = comparisonHTML;
    }

    document.getElementById('results-overlay').classList.add('visible');
}

// Review test
function reviewTest() {
    document.getElementById('results-overlay').classList.remove('visible');
    currentQuestionIndex = 0;

    // Mark all answers as shown
    Object.keys(userAnswers).forEach(index => {
        userAnswers[index].shown = true;
    });

    renderQuestion();
    renderNavigation();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

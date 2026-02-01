// Sample questions (hardcoded)
const originalQuestions = [
    {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        answer: 2
    },
    {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        answer: 1
    },
    {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        answer: 1
    },
    {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        answer: 3
    },
    {
        question: "Who wrote 'To Kill a Mockingbird'?",
        options: ["Harper Lee", "J.K. Rowling", "Ernest Hemingway", "Mark Twain"],
        answer: 0
    }
];

// Shuffle function
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Global variables
let questions = [];
let currentQuestionIndex = 0;
let answers = [];
let reviewed = [];
let timer;
let timeLeft = 10 * 60; // 10 minutes in seconds
let tabSwitches = 0;
let fullscreenExits = 0;
let warnings = 0;
let isFullscreen = false;
let studentName = '';

// DOM elements
const startScreen = document.getElementById('start-screen');
const examScreen = document.getElementById('exam-screen');
const resultsScreen = document.getElementById('results-screen');
const timerDisplay = document.getElementById('timer');
const warningsDisplay = document.getElementById('warnings');
const questionText = document.getElementById('question-text');
const optionsDiv = document.getElementById('options');
const paletteButtons = document.getElementById('palette-buttons');

// Event listeners
document.getElementById('start-btn').addEventListener('click', startExam);
document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('prev-btn').addEventListener('click', prevQuestion);
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('review-btn').addEventListener('click', markForReview);
document.getElementById('submit-btn').addEventListener('click', submitExam);
document.getElementById('restart-btn').addEventListener('click', restartExam);

// Anti-cheating: Disable right-click, copy-paste, inspect
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        warnings++;
        updateWarnings();
    }
});

// Tab switch and window blur detection
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        tabSwitches++;
        warnings++;
        updateWarnings();
        if (warnings >= 3) {
            submitExam();
        }
    }
});

window.addEventListener('blur', () => {
    warnings++;
    updateWarnings();
    if (warnings >= 3) {
        submitExam();
    }
});

// Fullscreen change detection
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        if (isFullscreen) {
            fullscreenExits++;
            warnings++;
            updateWarnings();
            if (fullscreenExits >= 2) {
                submitExam();
            }
        }
        isFullscreen = false;
    } else {
        isFullscreen = true;
    }
});

function startExam() {
    studentName = document.getElementById('student-name').value.trim();
    if (!studentName) {
        alert('Please enter your name.');
        return;
    }
    startScreen.classList.add('hidden');
    examScreen.classList.remove('hidden');
    
    // Randomize questions and options
    questions = shuffle([...originalQuestions]);
    questions.forEach(q => {
        q.options = shuffle([...q.options]);
        // Adjust answer index after shuffling
        q.shuffledAnswer = q.options.indexOf(originalQuestions.find(oq => oq.question === q.question).options[q.answer]);
    });
    
    answers = new Array(questions.length).fill(null);
    reviewed = new Array(questions.length).fill(false);
    
    loadQuestion();
    startTimer();
    generatePalette();
    loadSavedAnswers();
}

function loadQuestion() {
    const q = questions[currentQuestionIndex];
    questionText.textContent = `${currentQuestionIndex + 1}. ${q.question}`;
    optionsDiv.innerHTML = '';
    q.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.addEventListener('click', () => selectOption(index));
        if (answers[currentQuestionIndex] === index) {
            optionDiv.classList.add('selected');
        }
        optionsDiv.appendChild(optionDiv);
    });
    updatePalette();
}

function selectOption(index) {
    answers[currentQuestionIndex] = index;
    document.querySelectorAll('.option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === index);
    });
    saveAnswers();
    updatePalette();
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function markForReview() {
    reviewed[currentQuestionIndex] = !reviewed[currentQuestionIndex];
    updatePalette();
}

function generatePalette() {
    paletteButtons.innerHTML = '';
    questions.forEach((_, index) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.textContent = index + 1;
        btn.addEventListener('click', () => {
            currentQuestionIndex = index;
            loadQuestion();
        });
        paletteButtons.appendChild(btn);
    });
    updatePalette();
}

function updatePalette() {
    document.querySelectorAll('.palette-btn').forEach((btn, index) => {
        btn.classList.remove('palette-attempted', 'palette-unattempted', 'palette-reviewed');
        if (answers[index] !== null) {
            btn.classList.add('palette-attempted');
        } else if (reviewed[index]) {
            btn.classList.add('palette-reviewed');
        } else {
            btn.classList.add('palette-unattempted');
        }
    });
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (timeLeft <= 0) {
            submitExam();
        }
    }, 1000);
}

function updateWarnings() {
    warningsDisplay.textContent = `Warnings: ${warnings}`;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function saveAnswers() {
    localStorage.setItem('examAnswers', JSON.stringify(answers));
    localStorage.setItem('examReviewed', JSON.stringify(reviewed));
}

function loadSavedAnswers() {
    const savedAnswers = localStorage.getItem('examAnswers');
    const savedReviewed = localStorage.getItem('examReviewed');
    if (savedAnswers) {
        answers = JSON.parse(savedAnswers);
    }
    if (savedReviewed) {
        reviewed = JSON.parse(savedReviewed);
    }
}

function submitExam() {
    clearInterval(timer);
    examScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    let correct = 0;
    let attempted = 0;
    answers.forEach((answer, index) => {
        if (answer !== null) {
            attempted++;
            if (answer === questions[index].shuffledAnswer) {
                correct++;
            }
        }
    });
    
    const score = (correct / questions.length) * 100;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
    const timeTaken = (10 * 60 - timeLeft) / 60; // in minutes
    
    document.getElementById('score').textContent = `Score: ${correct}/${questions.length} (${score.toFixed(2)}%)`;
    document.getElementById('analysis').innerHTML = `
        <p>Attempted: ${attempted}/${questions.length}</p>
        <p>Accuracy: ${accuracy.toFixed(2)}%</p>
        <p>Time Taken: ${timeTaken.toFixed(2)} minutes</p>
    `;
    
    const integrity = (warnings === 0 && fullscreenExits === 0 && tabSwitches === 0) ? 'High' : (warnings < 3 ? 'Medium' : 'Low');
    document.getElementById('anti-cheat-report').innerHTML = `
        <h3>Anti-Cheating Report</h3>
        <p>Tab Switches: ${tabSwitches}</p>
        <p>Fullscreen Exits: ${fullscreenExits}</p>
        <p>Total Warnings: ${warnings}</p>
        <p>Exam Integrity: ${integrity}</p>
    `;
}

function restartExam() {
    location.reload();
}
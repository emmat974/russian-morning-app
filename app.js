const DATA_FILES = [
  'data/serie-familles.json',
  'data/serie-formes.json',
  'data/serie-contextes.json',
  'data/serie-rappel.json'
];

const state = {
  set: null,
  questions: [],
  index: 0,
  score: 0,
  mistakes: [],
  answered: false
};

const $ = id => document.getElementById(id);
const screens = ['startScreen', 'quizScreen', 'endScreen'];

function showScreen(id) {
  screens.forEach(name => $(name).classList.toggle('hidden', name !== id));
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:]/g, '')
    .trim();
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function loadRandomSet() {
  $('startBtn').disabled = true;
  $('setLabel').textContent = 'Chargement…';
  const candidates = shuffle(DATA_FILES);

  for (const file of candidates) {
    try {
      const response = await fetch(file, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.set = await response.json();
      state.questions = shuffle(state.set.questions).slice(0, state.set.sessionSize || 10);
      $('setLabel').textContent = state.set.title;
      $('startBtn').disabled = false;
      return;
    } catch (error) {
      console.warn(`Impossible de charger ${file}`, error);
    }
  }

  $('setLabel').textContent = 'Erreur de chargement';
  document.querySelector('#startScreen .muted').textContent =
    'L’application doit être ouverte via un petit serveur web, pas directement en file://.';
}

function startSession() {
  state.index = 0;
  state.score = 0;
  state.mistakes = [];
  renderQuestion();
  showScreen('quizScreen');
}

function renderQuestion() {
  state.answered = false;
  const question = state.questions[state.index];
  $('progressText').textContent = `${state.index + 1} / ${state.questions.length}`;
  $('scoreText').textContent = `${state.score} bonne${state.score > 1 ? 's' : ''} réponse${state.score > 1 ? 's' : ''}`;
  $('progressBar').style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
  $('questionType').textContent = question.label;
  $('questionPrompt').textContent = question.prompt;
  $('questionContext').textContent = question.context || '';
  $('feedback').className = 'feedback hidden';
  $('nextBtn').classList.add('hidden');
  $('choices').innerHTML = '';
  $('textMode').classList.add('hidden');
  $('answerInput').value = '';

  if (question.type === 'choice') {
    shuffle(question.options).forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-btn';
      button.textContent = option;
      button.addEventListener('click', () => checkChoice(button, option));
      $('choices').appendChild(button);
    });
  } else {
    $('textMode').classList.remove('hidden');
    setTimeout(() => $('answerInput').focus(), 50);
  }
}

function checkChoice(button, selected) {
  if (state.answered) return;
  const question = state.questions[state.index];
  const correct = normalize(selected) === normalize(question.answer);
  state.answered = true;

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
    if (normalize(btn.textContent) === normalize(question.answer)) btn.classList.add('correct');
  });

  if (!correct) button.classList.add('wrong');
  finishQuestion(correct, selected);
}

function checkText() {
  if (state.answered) return;
  const value = $('answerInput').value;
  if (!value.trim()) return;
  const question = state.questions[state.index];
  const accepted = [question.answer, ...(question.accepted || [])];
  const correct = accepted.some(answer => normalize(answer) === normalize(value));
  state.answered = true;
  $('answerInput').disabled = true;
  $('validateBtn').disabled = true;
  finishQuestion(correct, value);
}

function finishQuestion(correct, selected) {
  const question = state.questions[state.index];
  if (correct) {
    state.score += 1;
    $('feedback').className = 'feedback good';
    $('feedback').innerHTML = `<strong>Correct.</strong> ${question.explanation}`;
  } else {
    state.mistakes.push({ question, selected });
    $('feedback').className = 'feedback bad';
    $('feedback').innerHTML = `<strong>Piège.</strong> La réponse était <strong>${question.answer}</strong>.<br>${question.explanation}`;
  }
  $('feedback').classList.remove('hidden');
  $('nextBtn').textContent = state.index === state.questions.length - 1 ? 'Voir le résultat' : 'Question suivante';
  $('nextBtn').classList.remove('hidden');
  $('scoreText').textContent = `${state.score} bonne${state.score > 1 ? 's' : ''} réponse${state.score > 1 ? 's' : ''}`;
}

function nextQuestion() {
  $('answerInput').disabled = false;
  $('validateBtn').disabled = false;
  if (state.index >= state.questions.length - 1) {
    renderEnd();
    return;
  }
  state.index += 1;
  renderQuestion();
}

function renderEnd() {
  showScreen('endScreen');
  $('finalScore').textContent = `${state.score} / ${state.questions.length}`;
  const ratio = state.score / state.questions.length;
  $('finalMessage').textContent = ratio >= 0.9
    ? 'Très solide. Les pièges ne prennent presque plus.'
    : ratio >= 0.7
      ? 'Bon niveau. Refaire une série aidera à fixer les formes proches.'
      : 'Les confusions sont normales : ce sont précisément celles qu’il faut automatiser.';

  $('mistakes').innerHTML = '';
  state.mistakes.forEach(({ question, selected }) => {
    const item = document.createElement('div');
    item.className = 'mistake-item';
    item.innerHTML = `<strong>${question.prompt}</strong><br><span class="muted">Ta réponse : ${selected || '—'} · Réponse : ${question.answer}</span>`;
    $('mistakes').appendChild(item);
  });
}

$('startBtn').addEventListener('click', startSession);
$('validateBtn').addEventListener('click', checkText);
$('answerInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') checkText();
});
$('nextBtn').addEventListener('click', nextQuestion);
$('restartBtn').addEventListener('click', async () => {
  showScreen('startScreen');
  await loadRandomSet();
});
$('newSessionBtn').addEventListener('click', async () => {
  showScreen('startScreen');
  await loadRandomSet();
});

loadRandomSet();

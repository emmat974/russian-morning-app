const DATA_FILES = [
  'data/banque-ch1-recit.json',
  'data/banque-ch1-dialogue.json',
  'data/banque-ch2-recit.json',
  'data/banque-ch2-dialogue.json'
];

const SESSION_PLAN = [
  { chapter: 1, section: 'recit', count: 3 },
  { chapter: 1, section: 'dialogue', count: 2 },
  { chapter: 2, section: 'recit', count: 3 },
  { chapter: 2, section: 'dialogue', count: 2 }
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
  // Les accents toniques des manuels ne font pas partie de l’orthographe russe.
  // On retire donc tous les signes diacritiques avant de comparer les réponses.
  return String(value ?? '')
    .toLocaleLowerCase('ru')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:«»"'’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function withoutStress(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
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
  $('setLabel').textContent = 'Composition d’une série équilibrée…';

  try {
    const banks = await Promise.all(DATA_FILES.map(async file => {
      const response = await fetch(file, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
      return response.json();
    }));

    const selected = [];
    const usedFamilies = new Set();

    SESSION_PLAN.forEach(part => {
      const bank = banks.find(item => item.chapter === part.chapter && item.section === part.section);
      if (!bank) return;
      const candidates = shuffle(bank.questions);
      let added = 0;

      // Premier passage : éviter de répéter une même famille dans la série.
      for (const question of candidates) {
        if (added >= part.count) break;
        const family = question.family || normalize(question.answer);
        if (usedFamilies.has(family)) continue;
        selected.push(question);
        usedFamilies.add(family);
        added += 1;
      }

      // Deuxième passage de secours si une banque ne contient pas assez de familles différentes.
      for (const question of candidates) {
        if (added >= part.count) break;
        if (selected.includes(question)) continue;
        selected.push(question);
        added += 1;
      }
    });

    // Mélange global, tout en évitant autant que possible deux questions du même bloc à la suite.
    const remaining = shuffle(selected);
    const ordered = [];
    while (remaining.length) {
      const previous = ordered.at(-1);
      let index = remaining.findIndex(question =>
        !previous || question.chapter !== previous.chapter || question.section !== previous.section
      );
      if (index < 0) index = 0;
      const [question] = remaining.splice(index, 1);
      ordered.push(question);
    }

    state.set = { title: 'Série équilibrée — récits et dialogues' };
    state.questions = ordered;
    $('setLabel').textContent = '10 questions : Ch. 1 récit/dialogue + Ch. 2 récit/dialogue';
    $('startBtn').disabled = false;
  } catch (error) {
    console.warn('Impossible de charger les banques', error);
    $('setLabel').textContent = 'Erreur de chargement';
    document.querySelector('#startScreen .muted').textContent =
      'L’application doit être ouverte via GitHub Pages ou un petit serveur web.';
  }
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
  $('wordBank').classList.add('hidden');
  $('wordBank').innerHTML = '';
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
    if (Array.isArray(question.suggestions) && question.suggestions.length) {
      const title = document.createElement('p');
      title.className = 'word-bank-title';
      title.textContent = 'Formes proposées — une seule convient à la phrase';
      $('wordBank').appendChild(title);
      const list = document.createElement('div');
      list.className = 'word-bank-list';
      shuffle(question.suggestions).forEach(word => {
        const chip = document.createElement('span');
        chip.className = 'word-chip';
        chip.textContent = word;
        list.appendChild(chip);
      });
      $('wordBank').appendChild(list);
      $('wordBank').classList.remove('hidden');
    }
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderLesson(question, selected, correct) {
  const lesson = question.lesson || { rule: question.explanation };
  const observations = (lesson.observe || [])
    .map(line => `<li>${escapeHtml(withoutStress(line))}</li>`)
    .join('');
  const selectedText = withoutStress(selected);
  const fullSentence = withoutStress(question.fullSentence || question.prompt.replace('___', question.answer));
  const fullTranslation = question.fullTranslation || question.context || '';
  return `
    <div class="lesson-block">
      <div class="source-sentence">
        <strong>Phrase complète du chapitre</strong>
        <p class="source-russian">${escapeHtml(fullSentence)}</p>
        ${fullTranslation ? `<p class="source-translation">${escapeHtml(fullTranslation)}</p>` : ''}
      </div>
      <p><strong>Pourquoi cette forme ?</strong><br>${escapeHtml(withoutStress(lesson.rule || question.explanation))}</p>
      ${!correct ? `<p><strong>Pourquoi « ${escapeHtml(selectedText)} » ne convient pas ?</strong><br>${escapeHtml(withoutStress(lesson.trap || 'Cette forme correspond à un autre rôle dans la phrase.'))}</p>` : ''}
      ${observations ? `<div><strong>Compare :</strong><ul>${observations}</ul></div>` : ''}
      ${lesson.memory ? `<p class="memory"><strong>À retenir :</strong> ${escapeHtml(withoutStress(lesson.memory))}</p>` : ''}
      <p class="accent-reminder">Les accents affichés dans le cours servent uniquement à la prononciation. Ils ne sont jamais exigés dans ta saisie.</p>
    </div>`;
}

function finishQuestion(correct, selected) {
  const question = state.questions[state.index];
  const displayedAnswer = withoutStress(question.answer);
  const displayedSelected = withoutStress(selected);

  if (correct) {
    state.score += 1;
    $('feedback').className = 'feedback good';
    $('feedback').innerHTML = `<strong>Correct.</strong>${renderLesson(question, selected, true)}`;
  } else {
    state.mistakes.push({ question, selected });
    $('feedback').className = 'feedback bad';
    $('feedback').innerHTML = `
      <strong>Piège.</strong><br>
      Tu as choisi : <strong>${escapeHtml(displayedSelected || '—')}</strong><br>
      Forme attendue : <strong>${escapeHtml(displayedAnswer)}</strong>
      ${renderLesson(question, selected, false)}
    `;
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
    item.innerHTML = `<strong>${question.prompt}</strong><br><span class="muted">Ta réponse : ${withoutStress(selected) || '—'} · Réponse : ${withoutStress(question.answer)}</span>`;
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

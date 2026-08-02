const DATA_FILES = [
  'data/banque-ch1-recit.json',
  'data/banque-ch1-dialogue.json',
  'data/banque-ch2-recit.json',
  'data/banque-ch2-dialogue.json'
];

const CORE_QUESTIONS = 10;
const MAX_QUESTIONS_WITH_REVISIONS = 14;
const STORAGE_KEY = 'russe-du-matin-mistakes-v6';
const TRANSLATION_DATA_FILE = 'data/series-traduction.json';

const state = {
  banks: [],
  translationSeries: [],
  mode: 'course',
  selectedSeriesId: null,
  allQuestions: [],
  questions: [],
  index: 0,
  score: 0,
  mistakes: [],
  answered: false,
  currentBuiltAnswer: [],
  persistentMistakes: loadMistakeMemory()
};

const $ = id => document.getElementById(id);
const screens = ['modeScreen', 'startScreen', 'translationScreen', 'quizScreen', 'endScreen'];

function showScreen(id) {
  screens.forEach(name => $(name).classList.toggle('hidden', name !== id));
}

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('ru')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:«»"'’`—–-]/g, '')
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

function loadMistakeMemory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveMistakeMemory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.persistentMistakes));
}

function familyKey(question) {
  return question.family || normalize(question.answer);
}

function bankKey(question) {
  return `${question.chapter}-${question.section}`;
}

function questionId(question) {
  return `${bankKey(question)}-${familyKey(question)}-${normalize(question.fullSentence || question.prompt)}`;
}

async function loadBanks() {
  $('startBtn').disabled = true;
  $('courseModeBtn').disabled = true;
  $('translationModeBtn').disabled = true;

  try {
    let courseBanks;
    let translationData;

    // Les données intégrées permettent aussi d’ouvrir index.html directement
    // depuis le disque, où les navigateurs bloquent souvent fetch(file://...).
    if (window.RUSSIAN_APP_DATA) {
      courseBanks = window.RUSSIAN_APP_DATA.courseBanks;
      translationData = window.RUSSIAN_APP_DATA.translationData;
    } else {
      [courseBanks, translationData] = await Promise.all([
        Promise.all(DATA_FILES.map(async file => {
          const response = await fetch(file, { cache: 'no-store' });
          if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
          return response.json();
        })),
        fetch(TRANSLATION_DATA_FILE, { cache: 'no-store' }).then(response => {
          if (!response.ok) throw new Error(`${TRANSLATION_DATA_FILE}: HTTP ${response.status}`);
          return response.json();
        })
      ]);
    }

    state.banks = courseBanks;
    state.translationSeries = translationData.series || [];
    state.allQuestions = state.banks.flatMap(bank =>
      bank.questions.map(question => ({
        ...question,
        chapter: bank.chapter,
        section: bank.section,
        bankTitle: bank.title
      }))
    );

    composeSession();
    renderTranslationSeries();
    $('startBtn').disabled = false;
    $('courseModeBtn').disabled = false;
    $('translationModeBtn').disabled = false;
    $('loadingLabel').textContent = `${state.allQuestions.length} questions de cours · ${state.translationSeries.length} séries de traduction`;
  } catch (error) {
    console.warn('Impossible de charger les banques', error);
    $('loadingLabel').textContent = 'Erreur de chargement des exercices.';
  }
}

function weightedCandidates(bankQuestions, usedIds, usedFamilies) {
  return shuffle(bankQuestions)
    .filter(q => !usedIds.has(questionId(q)))
    .sort((a, b) => {
      const aMistakes = state.persistentMistakes[familyKey(a)] || 0;
      const bMistakes = state.persistentMistakes[familyKey(b)] || 0;
      const aRepeatPenalty = usedFamilies.has(familyKey(a)) ? -3 : 0;
      const bRepeatPenalty = usedFamilies.has(familyKey(b)) ? -3 : 0;
      return (bMistakes + bRepeatPenalty) - (aMistakes + aRepeatPenalty);
    });
}

function composeSession() {
  const usedIds = new Set();
  const usedFamilies = new Set();
  const selected = [];
  const banks = shuffle(state.banks.map(bank => ({
    key: `${bank.chapter}-${bank.section}`,
    questions: state.allQuestions.filter(q => q.chapter === bank.chapter && q.section === bank.section)
  })));

  // On pioche tour à tour dans les quatre banques, au lieu de choisir un fichier entier.
  while (selected.length < CORE_QUESTIONS) {
    let addedThisRound = false;
    for (const bank of banks) {
      if (selected.length >= CORE_QUESTIONS) break;
      const candidates = weightedCandidates(bank.questions, usedIds, usedFamilies);
      let pick = candidates.find(q => !usedFamilies.has(familyKey(q))) || candidates[0];
      if (!pick) continue;
      selected.push(pick);
      usedIds.add(questionId(pick));
      usedFamilies.add(familyKey(pick));
      addedThisRound = true;
    }
    if (!addedThisRound) break;
  }

  const variantPattern = [
    'choice', 'guidedText', 'translationChoice',
    'correction', 'order', 'choice',
    'freeText', 'translationChoice', 'order', 'freeText'
  ];

  state.questions = selected.map((question, index) =>
    prepareVariant(question, variantPattern[index % variantPattern.length], difficultyFor(index))
  );

  $('setLabel').textContent = '10 questions mélangées · difficulté progressive · révisions automatiques';
}

function difficultyFor(index) {
  if (index < 3) return 1;
  if (index < 7) return 2;
  return 3;
}

function renderTranslationSeries() {
  $('translationSeries').innerHTML = '';
  state.translationSeries.forEach(series => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'series-card';
    button.innerHTML = `
      <strong>${escapeHtml(series.title)}</strong>
      <span>${escapeHtml(series.description)}</span>
      <small>${series.questions.length} phrases</small>
    `;
    button.addEventListener('click', () => selectTranslationSeries(series.id));
    $('translationSeries').appendChild(button);
  });
}

function selectTranslationSeries(seriesId) {
  const series = state.translationSeries.find(item => item.id === seriesId);
  if (!series) return;
  state.mode = 'translation';
  state.selectedSeriesId = seriesId;
  state.questions = series.questions.map((question, index) => prepareTranslationQuestion(question, series, index));
  startSession();
}

function prepareTranslationQuestion(base, series, index) {
  return {
    ...base,
    family: `translation-${series.id}`,
    seriesTitle: series.title,
    renderType: 'text',
    variant: 'translationText',
    difficulty: index < 2 ? 1 : index < 5 ? 2 : 3,
    displayLabel: `Série : ${series.title}`,
    displayPrompt: base.fr,
    displayContext: index < 2
      ? 'Écris la phrase complète en russe. Les accents toniques et la ponctuation ne sont pas obligatoires.'
      : 'Traduis sans regarder tes cours.',
    showSuggestions: false,
    expected: base.ru,
    answer: base.ru,
    accepted: base.accepted || [],
    fullSentence: base.ru,
    fullTranslation: base.fr,
    lesson: {
      rule: base.note || 'Compare la structure russe avec la phrase française.',
      trap: 'Vérifie surtout qui fait l’action, qui la reçoit et la forme du verbe.',
      memory: base.note || 'Retiens la phrase comme un modèle complet.'
    }
  };
}

function getCleanOptions(question) {
  const values = [question.answer, ...(question.options || []), ...(question.suggestions || [])];
  const unique = [];
  const seen = new Set();
  values.forEach(value => {
    const key = normalize(value);
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(withoutStress(value));
    }
  });
  return unique;
}

function prepareVariant(base, variant, difficulty, isRevision = false) {
  const question = { ...base, variant, difficulty, isRevision };
  const fullSentence = withoutStress(base.fullSentence || base.prompt.replace('___', base.answer));
  const translation = base.fullTranslation || base.context || '';
  const options = getCleanOptions(base);

  if (variant === 'choice') {
    question.renderType = 'choice';
    question.displayLabel = difficulty === 1 ? 'Choisis la bonne forme' : 'Complète sans te fier à la traduction';
    question.displayPrompt = withoutStress(base.prompt);
    question.displayContext = translation ? `Contexte : ${translation}` : 'Observe la phrase complète pour retrouver la forme attendue.';
    question.renderOptions = options;
    question.expected = base.answer;
  }

  if (variant === 'guidedText') {
    question.renderType = 'text';
    question.displayLabel = 'Écris la forme proposée qui convient';
    question.displayPrompt = withoutStress(base.prompt);
    question.displayContext = translation ? `Contexte : ${translation}` : 'Observe le sens général de la phrase.';
    question.showSuggestions = true;
    question.renderOptions = options;
    question.expected = base.answer;
  }

  if (variant === 'freeText') {
    question.renderType = 'text';
    question.displayLabel = isRevision ? 'Révision : retrouve la bonne forme' : 'Écris sans banque de mots';
    question.displayPrompt = withoutStress(base.prompt);
    question.displayContext = translation ? `Contexte : ${translation}` : 'Retrouve le mot exact utilisé dans le chapitre.';
    question.showSuggestions = false;
    question.expected = base.answer;
  }

  if (variant === 'correction') {
    const wrong = options.find(option => normalize(option) !== normalize(base.answer)) || '___';
    question.renderType = 'text';
    question.displayLabel = 'Corrige le mot qui ne convient pas';
    question.displayPrompt = fullSentence.replace(withoutStress(base.answer), wrong);
    question.displayContext = translation ? `Contexte : ${translation} · Recopie uniquement le mot corrigé.` : 'Recopie uniquement le mot corrigé.';
    question.showSuggestions = difficulty === 1;
    question.renderOptions = options;
    question.expected = base.answer;
  }

  if (variant === 'translationChoice') {
    const distractors = shuffle(state.allQuestions
      .filter(q => questionId(q) !== questionId(base))
      .map(q => withoutStress(q.fullSentence || q.prompt.replace('___', q.answer)))
      .filter(sentence => sentence && sentence !== fullSentence))
      .slice(0, 3);
    question.renderType = 'choice';
    question.displayLabel = 'Retrouve la phrase russe';
    question.displayPrompt = translation;
    question.displayContext = 'Choisis la phrase qui correspond exactement.';
    question.renderOptions = shuffle([fullSentence, ...distractors]);
    question.expected = fullSentence;
  }

  if (variant === 'order') {
    question.renderType = 'order';
    question.displayLabel = 'Remets la phrase dans l’ordre';
    question.displayPrompt = translation;
    question.displayContext = 'Appuie sur les blocs dans le bon ordre.';
    question.orderTokens = tokenizeSentence(fullSentence);
    question.expected = fullSentence;
  }

  return question;
}

function tokenizeSentence(sentence) {
  return sentence
    .replace(/^—\s*/, '')
    .replace(/[.!?]$/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function startSession() {
  state.index = 0;
  state.score = 0;
  state.mistakes = [];
  renderQuestion();
  showScreen('quizScreen');
}

function openCourseMode() {
  state.mode = 'course';
  state.selectedSeriesId = null;
  composeSession();
  showScreen('startScreen');
}

function openTranslationMode() {
  state.mode = 'translation';
  showScreen('translationScreen');
}

function openModeScreen() {
  showScreen('modeScreen');
}

function resetQuestionUi() {
  state.answered = false;
  state.currentBuiltAnswer = [];
  $('feedback').className = 'feedback hidden';
  $('nextBtn').classList.add('hidden');
  $('choices').innerHTML = '';
  $('textMode').classList.add('hidden');
  $('orderMode').classList.add('hidden');
  $('orderTokens').innerHTML = '';
  $('builtSentence').textContent = 'Ta phrase apparaîtra ici.';
  $('wordBank').classList.add('hidden');
  $('wordBank').innerHTML = '';
  $('answerInput').value = '';
  $('answerInput').disabled = false;
  $('validateBtn').disabled = false;
  $('validateOrderBtn').disabled = false;
}

function renderQuestion() {
  resetQuestionUi();
  const question = state.questions[state.index];
  $('progressText').textContent = `${state.index + 1} / ${state.questions.length}`;
  $('scoreText').textContent = `${state.score} bonne${state.score > 1 ? 's' : ''} réponse${state.score > 1 ? 's' : ''}`;
  $('progressBar').style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
  $('questionType').textContent = `${question.displayLabel}${question.isRevision ? ' · erreur revue' : ''}`;
  $('questionPrompt').textContent = question.displayPrompt;
  $('questionContext').textContent = question.displayContext || '';
  $('questionContext').classList.toggle('hidden', !question.displayContext);

  if (question.renderType === 'choice') {
    shuffle(question.renderOptions).forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-btn';
      button.textContent = option;
      button.addEventListener('click', () => checkChoice(button, option));
      $('choices').appendChild(button);
    });
  }

  if (question.renderType === 'text') {
    $('textMode').classList.remove('hidden');
    if (question.showSuggestions && question.renderOptions?.length) {
      const title = document.createElement('p');
      title.className = 'word-bank-title';
      title.textContent = 'Formes possibles';
      $('wordBank').appendChild(title);
      const list = document.createElement('div');
      list.className = 'word-bank-list';
      shuffle(question.renderOptions).forEach(word => {
        const chip = document.createElement('span');
        chip.className = 'word-chip';
        chip.textContent = word;
        list.appendChild(chip);
      });
      $('wordBank').appendChild(list);
      $('wordBank').classList.remove('hidden');
    }
    const inputLabel = $('answerLabel');
    inputLabel.textContent = question.variant === 'translationText'
      ? 'Ta traduction en russe'
      : question.showSuggestions ? 'Recopie la forme correcte' : 'Écris le mot manquant';
    setTimeout(() => $('answerInput').focus(), 50);
  }

  if (question.renderType === 'order') {
    $('orderMode').classList.remove('hidden');
    shuffle(question.orderTokens).forEach((token, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'word-chip order-chip';
      button.textContent = token;
      button.dataset.tokenId = `${index}-${token}`;
      button.addEventListener('click', () => {
        if (button.disabled || state.answered) return;
        button.disabled = true;
        state.currentBuiltAnswer.push({ token, button });
        updateBuiltSentence();
      });
      $('orderTokens').appendChild(button);
    });
  }
}

function updateBuiltSentence() {
  $('builtSentence').textContent = state.currentBuiltAnswer.length
    ? state.currentBuiltAnswer.map(item => item.token).join(' ')
    : 'Ta phrase apparaîtra ici.';
}

function undoOrderToken() {
  if (state.answered || !state.currentBuiltAnswer.length) return;
  const item = state.currentBuiltAnswer.pop();
  item.button.disabled = false;
  updateBuiltSentence();
}

function checkChoice(button, selected) {
  if (state.answered) return;
  const question = state.questions[state.index];
  const correct = normalize(selected) === normalize(question.expected);
  state.answered = true;

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
    if (normalize(btn.textContent) === normalize(question.expected)) btn.classList.add('correct');
  });
  if (!correct) button.classList.add('wrong');
  finishQuestion(correct, selected);
}

function checkText() {
  if (state.answered) return;
  const value = $('answerInput').value;
  if (!value.trim()) return;
  const question = state.questions[state.index];
  const accepted = [question.expected, question.answer, ...(question.accepted || [])];
  const correct = accepted.some(answer => normalize(answer) === normalize(value));
  state.answered = true;
  $('answerInput').disabled = true;
  $('validateBtn').disabled = true;
  finishQuestion(correct, value);
}

function checkOrder() {
  if (state.answered || !state.currentBuiltAnswer.length) return;
  const value = state.currentBuiltAnswer.map(item => item.token).join(' ');
  const question = state.questions[state.index];
  const correct = normalize(value) === normalize(question.expected);
  state.answered = true;
  document.querySelectorAll('.order-chip').forEach(button => button.disabled = true);
  $('validateOrderBtn').disabled = true;
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
  const fullSentence = withoutStress(question.fullSentence || question.prompt.replace('___', question.answer));
  const fullTranslation = question.fullTranslation || question.context || '';
  return `
    <div class="lesson-block">
      <div class="source-sentence">
        <strong>${question.variant === 'translationText' ? 'Phrase modèle' : 'Phrase complète du chapitre'}</strong>
        <p class="source-russian">${escapeHtml(fullSentence)}</p>
        ${fullTranslation ? `<p class="source-translation">${escapeHtml(fullTranslation)}</p>` : ''}
      </div>
      <p><strong>Ce qu’il fallait observer</strong><br>${escapeHtml(withoutStress(lesson.rule || question.explanation || ''))}</p>
      ${!correct ? `<p><strong>Pourquoi ta réponse ne convient pas ici</strong><br>${escapeHtml(withoutStress(lesson.trap || 'Cette forme correspond à un autre rôle ou à une autre phrase.'))}</p>` : ''}
      ${observations ? `<div><strong>Compare :</strong><ul>${observations}</ul></div>` : ''}
      ${lesson.memory ? `<p class="memory"><strong>À retenir :</strong> ${escapeHtml(withoutStress(lesson.memory))}</p>` : ''}
    </div>`;
}

function scheduleRevision(question) {
  if (state.mode === 'translation') return;
  if (state.questions.length >= MAX_QUESTIONS_WITH_REVISIONS) return;
  const family = familyKey(question);
  const futureHasRevision = state.questions.slice(state.index + 1)
    .some(q => q.isRevision && familyKey(q) === family);
  if (futureHasRevision) return;

  const variants = question.variant === 'order'
    ? ['freeText', 'choice']
    : question.variant === 'freeText'
      ? ['choice', 'order']
      : ['freeText', 'order'];
  const retryVariant = variants[(state.persistentMistakes[family] || 1) % variants.length];
  const retry = prepareVariant(question, retryVariant, 3, true);
  const insertAt = Math.min(state.index + 3, state.questions.length);
  state.questions.splice(insertAt, 0, retry);
}

function finishQuestion(correct, selected) {
  const question = state.questions[state.index];
  const displayedAnswer = withoutStress(question.expected);
  const displayedSelected = withoutStress(selected);
  const family = familyKey(question);

  if (correct) {
    state.score += 1;
    if (state.persistentMistakes[family]) {
      state.persistentMistakes[family] = Math.max(0, state.persistentMistakes[family] - 1);
    }
    $('feedback').className = 'feedback good';
    $('feedback').innerHTML = `<strong>Correct.</strong>${renderLesson(question, selected, true)}`;
  } else {
    state.mistakes.push({ question, selected });
    state.persistentMistakes[family] = (state.persistentMistakes[family] || 0) + 1;
    scheduleRevision(question);
    $('feedback').className = 'feedback bad';
    $('feedback').innerHTML = `
      <strong>Piège.</strong><br>
      Ta réponse : <strong>${escapeHtml(displayedSelected || '—')}</strong><br>
      Réponse attendue : <strong>${escapeHtml(displayedAnswer)}</strong>
      <p class="revision-note">Cette difficulté reviendra un peu plus loin, sous une autre forme.</p>
      ${renderLesson(question, selected, false)}
    `;
  }

  saveMistakeMemory();
  $('feedback').classList.remove('hidden');
  $('nextBtn').textContent = state.index === state.questions.length - 1 ? 'Voir le résultat' : 'Question suivante';
  $('nextBtn').classList.remove('hidden');
  $('scoreText').textContent = `${state.score} bonne${state.score > 1 ? 's' : ''} réponse${state.score > 1 ? 's' : ''}`;
  $('progressText').textContent = `${state.index + 1} / ${state.questions.length}`;
}

function nextQuestion() {
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
  if (state.mode === 'translation') {
    $('finalMessage').textContent = ratio >= 0.9
      ? 'Très solide. Tu peux passer à une autre série ou refaire celle-ci plus tard sans aide.'
      : ratio >= 0.7
        ? 'Bon début. Refais cette série jusqu’à ce que les structures sortent sans recherche.'
        : 'Cette série contient encore des structures nouvelles. Relis les corrections puis recommence-la.';
    $('restartBtn').textContent = 'Choisir une autre série';
  } else {
    $('finalMessage').textContent = ratio >= 0.9
      ? 'Très solide. La prochaine série gardera des formats difficiles et continuera à mélanger les quatre banques.'
      : ratio >= 0.7
        ? 'Bon niveau. Les formes ratées seront davantage proposées dans les prochaines séries.'
        : 'Les erreurs ont été mémorisées : elles reviendront progressivement, sans bloquer toute la série dessus.';
    $('restartBtn').textContent = 'Refaire une autre série';
  }

  $('mistakes').innerHTML = '';
  state.mistakes.forEach(({ question, selected }) => {
    const item = document.createElement('div');
    item.className = 'mistake-item';
    item.innerHTML = `<strong>${escapeHtml(withoutStress(question.fullSentence || question.prompt))}</strong><br><span class="muted">Ta réponse : ${escapeHtml(withoutStress(selected) || '—')} · Réponse : ${escapeHtml(withoutStress(question.expected))}</span>`;
    $('mistakes').appendChild(item);
  });
}

$('courseModeBtn').addEventListener('click', openCourseMode);
$('translationModeBtn').addEventListener('click', openTranslationMode);
$('startBtn').addEventListener('click', startSession);
$('validateBtn').addEventListener('click', checkText);
$('validateOrderBtn').addEventListener('click', checkOrder);
$('undoOrderBtn').addEventListener('click', undoOrderToken);
$('answerInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') checkText();
});
$('nextBtn').addEventListener('click', nextQuestion);
$('restartBtn').addEventListener('click', () => {
  if (state.mode === 'translation') {
    showScreen('translationScreen');
  } else {
    composeSession();
    showScreen('startScreen');
  }
});
$('newSessionBtn').addEventListener('click', openModeScreen);

loadBanks();

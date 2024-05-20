const apiKeyInput = document.getElementById('api-key');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const noteContent = document.getElementById('note-content');
const loadingSpinner = document.getElementById('loading-spinner');
const contextInput = document.getElementById('context');
const characterCount = document.getElementById('character-count');
const outputTypeRadios = document.getElementsByName('output-type');

generateBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value;
  const outputType = [...outputTypeRadios].find(radio => radio.checked).value;

  if (validateFormInputs(apiKey)) {
    localStorage.setItem('apiKey', apiKey);
    if (outputType === 'cornell-notes') {
      window.location.href = 'notes.html';
    } else if (outputType === 'mcq') {
      window.location.href = 'mcq.html';
    } else if (outputType === 'flashcards') {
      window.location.href = 'flashcards.html';
    }
  }
});

function validateFormInputs(apiKey) {
  if (apiKey.trim() === '') {
    handleValidationError('Please provide the API key.');
    return false;
  }
  return true;
}

const apiKeyInput = document.getElementById('api-key');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const noteContent = document.getElementById('note-content');
const loadingSpinner = document.getElementById('loading-spinner');
const contextInput = document.getElementById('context');
const characterCount = document.getElementById('character-count');

contextInput.addEventListener('input', updateCharacterCount);

function updateCharacterCount() {
  const count = contextInput.value.length;
  characterCount.textContent = `${count}/15,000 characters`;
}

generateBtn.addEventListener('click', generateNote);
copyBtn.addEventListener('click', copyNoteToClipboard);

async function generateNote() {
  const context = contextInput.value;

  loadingSpinner.classList.remove('hidden');

  const formatInstructions = `
Please format the response as follows:

Cues:
- [Bullet points for key topics or questions]

Notes:
- [Main topic 1]:
  - [Subtopic 1 in details]
  - [Subtopic 2 in details]
- [Main topic 2]:
  - [Subtopic 1 in details]
  - [Subtopic 2 in details]
-[Must include simplified notes of all the key-details in the original context]

Summary:
[A concise summary of the main points]


`;

  const prompt = `${combinedContext}

${formatInstructions}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that generates notes based on the given context.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
        n: 1,
        stop: null,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const generatedNote = response.data.choices[0].message.content;
    displayNote(generatedNote);
  } catch (error) {
    console.error('Error generating note:', error);
    alert('An error occurred while generating the note. Please try again.');
  }

  loadingSpinner.classList.add('hidden');
}

async function copyNoteToClipboard() {
  const noteText = noteContent.innerText;
  try {
    await navigator.clipboard.writeText(noteText);
    alert('Note copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy note:', err);
    alert('Failed to copy note. Please try again.');
  }
}

const copyButtons = document.querySelectorAll('.copy-btn');

function updateStatistics(originalContext, notesContent) {
  const originalWords = originalContext.trim().split(/\s+/).length;
  const outputWords = notesContent.trim().split(/\s+/).length;
  const reducedWords = originalWords - outputWords;

  const sentenceCount = notesContent.trim().split(/[.!?]+/).length - 1;

  const readTime = Math.ceil(outputWords / 200);

  document.getElementById('reduced-words').textContent = reducedWords;
  document.getElementById('sentence-count').textContent = sentenceCount;
  document.getElementById('read-time').textContent = `${readTime}:00`;
}

function displayNote(note) {
  const cueContent = document.getElementById('cue-content');
  const notesContent = document.getElementById('notes-content');
  const summaryContent = document.getElementById('summary-content');

  cueContent.innerHTML = '';
  notesContent.innerHTML = '';
  summaryContent.innerHTML = '';

  const lines = note.split('\n');
  let currentSection = '';

  lines.forEach((line) => {
    if (line.trim() === '') {
      return;
    }

    if (line.startsWith('Cues:')) {
      currentSection = 'cues';
    } else if (line.startsWith('Notes:')) {
      currentSection = 'notes';
    } else if (line.startsWith('Summary:')) {
      currentSection = 'summary';
    } else {
      if (currentSection === 'cues') {
        cueContent.innerHTML += `<li>${line.trim().slice(2)}</li>`;
      } else if (currentSection === 'notes') {
        if (line.startsWith('- ')) {
          notesContent.innerHTML += `<h4>${line.slice(2)}</h4>`;
        } else if (line.startsWith('  - ')) {
          notesContent.innerHTML += `<ul><li>${line.slice(4)}</li></ul>`;
        }
      } else if (currentSection === 'summary') {
        summaryContent.innerHTML += `${line.trim()} `;
      }
    }
  });

  updateStatistics(contextInput.value, notesContent.innerText);
}


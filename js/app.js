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
  const apiKey = apiKeyInput.value;
  const context = contextInput.value;
  const tone = document.getElementById('tone-select').value;
  const length = document.getElementById('length-select').value;

  if (apiKey.trim() === '' || context.trim() === '') {
    alert('Please provide both the API key and context.');
    return;
  }

  loadingSpinner.classList.remove('hidden');

  const formatInstructions = `
  Please format the response as follows:

-USE ONLY SIMPLE ENGLISH WORDS AND BULLET POINTS
-please don't include analogies in your notes

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

  let toneInstruction = '';
  switch (tone) {
    case 'friendly':
      toneInstruction = 'Please use a casual and friendly tone in the notes.';
      break;
    case 'formal':
      toneInstruction = 'Please use a formal and academic tone in the notes.';
      break;
    default:
      toneInstruction = 'Please use a standard tone in the notes.';
  }

  let lengthInstruction = '';
  switch (length) {
    case 'short':
      lengthInstruction = 'Please keep the notes concise and focus on the key points.';
      break;
    case 'long':
      lengthInstruction = 'Please provide detailed and comprehensive notes, covering all the important details.';
      break;
    default:
      lengthInstruction = 'Please provide notes of normal length, covering the main points and relevant details.';
  }

  const prompt = `${context}

${formatInstructions}

${toneInstruction}

${lengthInstruction}`;

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

  const averageReadingPace = 200; 
  const readTime = Math.ceil(outputWords / averageReadingPace);

  document.getElementById('reduced-words').textContent = reducedWords;
  document.getElementById('sentence-count').textContent = sentenceCount;
  document.getElementById('read-time').textContent = `${readTime.toString().padStart(2, '0')}:00`;
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
        if (line.startsWith('- ')) {
          const listItem = document.createElement('li');
          listItem.textContent = line.trim().slice(2);
          cueContent.appendChild(listItem);
        }
      } else if (currentSection === 'notes') {
        if (line.startsWith('- ')) {
          const heading = document.createElement('h4');
          heading.textContent = line.slice(2);
          notesContent.appendChild(heading);
        } else if (line.startsWith('  - ')) {
          const listItem = document.createElement('li');
          listItem.textContent = line.slice(4);
          
          let lastElement = notesContent.lastElementChild;
          if (!lastElement || lastElement.tagName !== 'UL') {
            const unorderedList = document.createElement('ul');
            unorderedList.appendChild(listItem);
            notesContent.appendChild(unorderedList);
          } else {
            lastElement.appendChild(listItem);
          }
        } else {
          const paragraph = document.createElement('p');
          paragraph.textContent = line.trim();
          notesContent.appendChild(paragraph);
        }
      } else if (currentSection === 'summary') {
        summaryContent.textContent += line.trim() + ' ';
      }
    }
  });

  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const targetElement = document.getElementById(targetId);
      const text = targetElement.innerText;

      navigator.clipboard.writeText(text)
        .then(() => {
          alert('Content copied to clipboard!');
        })
        .catch((error) => {
          console.error('Failed to copy content:', error);
          alert('Failed to copy content. Please try again.');
        });
    });
  });

  updateStatistics(contextInput.value, notesContent.innerText);
}

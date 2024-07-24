document.addEventListener('DOMContentLoaded', () => {
  const apiKey = localStorage.getItem('apiKey');
  const backBtn = document.getElementById('back-btn');
  const generateNoteBtn = document.getElementById('generate-note-btn');
  const loadingSpinner = document.getElementById('loading-spinner');
  const contextInput = document.getElementById('context');
  const characterCount = document.getElementById('character-count');
  const toneSelect = document.getElementById('tone-select');
  const lengthSelect = document.getElementById('length-select');
  const notification = document.getElementById('notification');

  if (contextInput) {
    contextInput.addEventListener('input', updateCharacterCount);
  }

  window.addEventListener('beforeunload', () => {
    loadingSpinner.classList.remove('hidden');
  });

  function updateCharacterCount() {
    const count = contextInput.value.length;
    characterCount.textContent = `${count}/15,000 characters`;
  }

  if (generateNoteBtn) {
    generateNoteBtn.addEventListener('click', () => {
      const context = contextInput.value;
      const tone = toneSelect.value;
      const length = lengthSelect.value;

      if (!apiKey || !context) {
        alert('API key or context is missing. Please provide the required inputs.');
        return;
      }

      generateNote(context, tone, length);
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  async function generateNote(context, tone, length) {
    loadingSpinner.classList.remove('hidden');
    showNotification('Generating notes...', 'info');

    const toneInstructions = {
      standard: 'Use a neutral and professional tone.',
      friendly: 'Use a casual and friendly tone.',
      formal: 'Use a formal and academic tone.',
    };

    const lengthInstructions = {
      normal: 'Provide detailed notes.',
      short: 'Provide concise and brief notes.',
      long: 'Provide extended and comprehensive notes.',
    };

    const formatInstructions = `
      Please format the response exactly as follows:

      Cues:
      - [Bullet points for key topics or questions]

      Notes:
      - [Main topic 1]:
        - [Subtopic 1 in details]
        - [Subtopic 2 in details]
      - [Main topic 2]:
        - [Subtopic 1 in details]
        - [Subtopic 2 in details]
      - [Must include simplified notes of all the key-details in the original context]

      Summary:
      [A concise summary of the main points]
    `;

    const prompt = `${context}

    Tone: ${toneInstructions[tone]}
    Length: ${lengthInstructions[length]}

    ${formatInstructions}`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini-2024-07-18',
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
      showNotification('Notes generated successfully!', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      loadingSpinner.classList.add('hidden');
    }
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

  function handleError(error) {
    console.error('Error generating notes:', error);
    showNotification('Error generating notes. Please try again.', 'error');
  }

  function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `fixed top-0 left-0 right-0 p-4 text-white text-center ${getNotificationClass(type)}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
      notification.classList.add('hidden');
    }, 3000);
  }

  function getNotificationClass(type) {
    switch (type) {
      case 'info':
        return 'bg-green-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-green-500';
    }
  }
});

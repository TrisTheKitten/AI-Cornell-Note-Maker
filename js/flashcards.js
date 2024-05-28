document.addEventListener('DOMContentLoaded', () => {
    const apiKey = localStorage.getItem('apiKey');
    const backBtn = document.getElementById('back-btn');
    const generateFlashcardsBtn = document.getElementById('generate-flashcards-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const contextInput = document.getElementById('context');
    const numCardsSelect = document.getElementById('num-cards');
    const difficultySelect = document.getElementById('difficulty');
    const tonalitySelect = document.getElementById('tonality');
    const flashcardsContainer = document.getElementById('flashcards-container');
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
    
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  
    generateFlashcardsBtn.addEventListener('click', () => {
      const context = contextInput.value.trim();
      const numCards = numCardsSelect.value;
      const difficulty = difficultySelect.value;
      const tonality = tonalitySelect.value;
  
      if (!apiKey || context === '') {
        alert('API key or context is missing. Please provide the required inputs.');
        return;
      }
  
      generateFlashcards(context, numCards, difficulty, tonality);
    });
  
    async function generateFlashcards(context, numCards, difficulty, tonality) {
      loadingSpinner.classList.remove('hidden'); // Show spinner
      showNotification('Generating flashcards...', 'info');
  
      const difficultyInstructions = {
        easy: 'simple and straightforward',
        normal: 'moderate difficulty',
        hard: 'challenging and thought-provoking'
      };
  
      const tonalityInstructions = {
        casual: 'casual and friendly tone',
        standard: 'neutral and professional tone',
        academic: 'formal and academic tone'
      };
  
      const prompt = `${context}
Generate ${numCards} flashcards based on the provided context. The flashcards should be of ${difficultyInstructions[difficulty]} and have a ${tonalityInstructions[tonality]}. Format the output as follows:

  Front: [Question text]
  Back: [Answer text(Answer should be the key point of the question, include only main points, and be concise)]`;

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant that generates flashcards based on the given context.',
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
  
        const generatedFlashcards = response.data.choices[0].message.content.trim();
        displayFlashcards(generatedFlashcards);
        showNotification('Flashcards generated successfully!', 'success');
      } catch (error) {
        handleError(error);
      } finally {
        loadingSpinner.classList.add('hidden'); // Hide spinner
      }
    }
  
    function displayFlashcards(flashcards) {
      flashcardsContainer.innerHTML = '';
  
      const flashcardPairs = flashcards.split('\n\n');
      flashcardPairs.forEach(pair => {
        const [front, back] = pair.split('\n').map(line => line.replace(/^Front: |^Back: /, ''));
  
        const cardElement = document.createElement('div');
        cardElement.className = 'flashcard';
        cardElement.innerHTML = `
          <div class="flashcard-inner">
            <div class="flashcard-front bg-white p-4 border border-gray-300 rounded shadow-sm">
              ${front}
            </div>
            <div class="flashcard-back bg-gray-100 p-4 border border-gray-300 rounded shadow-sm">
              ${back}
            </div>
          </div>
        `;
  
        flashcardsContainer.appendChild(cardElement);
      });
    }
  
    function handleError(error) {
      console.error('Error generating flashcards:', error);
  
      if (error.response) {
        showNotification('An error occurred while communicating with the server. Please try again later.', 'error');
      } else if (error.request) {
        showNotification('No response received from the server. Please check your internet connection and try again.', 'error');
      } else {
        showNotification('An unexpected error occurred. Please try again.', 'error');
      }
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
  
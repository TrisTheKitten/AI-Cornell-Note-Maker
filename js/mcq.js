document.addEventListener('DOMContentLoaded', () => {
  const apiKey = localStorage.getItem('apiKey');
  const contextInput = document.getElementById('context');
  const mcqContent = document.getElementById('questions-content');
  const answersContent = document.getElementById('answers-content');
  const backBtn = document.getElementById('back-btn');
  const generateMcqBtn = document.getElementById('generate-mcq-btn');
  const numQuestionsSelect = document.getElementById('num-questions');
  const difficultySelect = document.getElementById('difficulty');
  const tonalitySelect = document.getElementById('tonality');
  const loadingSpinner = document.getElementById('loading-spinner');
  const submitMcqBtn = document.getElementById('submit-mcq-btn');
  let correctAnswers = [];

  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  
  submitMcqBtn.addEventListener('click', () => {
    checkAnswers();
  });

  generateMcqBtn.addEventListener('click', () => {
    const context = contextInput.value;
    const numQuestions = numQuestionsSelect.value;
    const difficulty = difficultySelect.value;
    const tonality = tonalitySelect.value;

    if (context.trim() === '') {
      alert('Please provide the context.');
      return;
    }

    generateMCQs(context, numQuestions, difficulty, tonality);
  });

  async function generateMCQs(context, numQuestions, difficulty, tonality) {
    if (!apiKey || !context) {
      alert('API key or context is missing. Please go back to the main menu and provide the required inputs.');
      return;
    }

    loadingSpinner.classList.remove('hidden'); // Show spinner

    const difficultyInstructions = {
      easy: 'The questions should be simple and straightforward.',
      normal: 'The questions should be of moderate difficulty.',
      hard: 'The questions should be challenging and thought-provoking.'
    };

    const tonalityInstructions = {
      casual: 'Please use a casual and friendly tone.',
      standard: 'Please use a neutral and professional tone.',
      academic: 'Please use a formal and academic tone.'
    };

    const prompt = `${context}

Generate ${numQuestions} multiple choice questions based on the given context. The questions should be ${difficultyInstructions[difficulty]} and have a ${tonalityInstructions[tonality]}. Each question should have exactly 4 options labeled A, B, C, and D, with one correct answer. Format the output as follows:
Question 1: [Question text]
A. [Option 1]
B. [Option 2]
C. [Option 3]
D. [Option 4]
Correct answer: [Correct option letter]
Repeat this format for all questions.`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that generates multiple choice questions based on the given context.',
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

      const generatedMCQs = response.data.choices[0].message.content.trim();
      displayMCQs(generatedMCQs);
    } catch (error) {
      console.error('Error generating MCQs:', error);
      handleError(error);
    }

    loadingSpinner.classList.add('hidden'); 
  }

  function displayMCQs(mcqs) {
    mcqContent.innerHTML = '';
    answersContent.innerHTML = '';
    correctAnswers = [];

    const questions = mcqs.split('\n\n');
    questions.forEach(questionBlock => {
      const lines = questionBlock.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        const questionText = lines[0];
        const options = lines.slice(1, lines.length - 1);
        const correctOptionLine = lines[lines.length - 1];

 
        const match = correctOptionLine.match(/Correct answer:\s*([A-D])/i);
        if (match) {
          const correctOptionLetter = match[1].toUpperCase(); // Ensure it's uppercase
          correctAnswers.push(correctOptionLetter);
          addQuestionToDOM(questionText, options);
        } else {
          console.error('Correct answer not found for question:', questionText);
        }
      }
    });

    submitMcqBtn.classList.remove('hidden');
  }

  function addQuestionToDOM(questionText, options) {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question', 'column');

    const questionLabel = document.createElement('p');
    questionLabel.textContent = questionText;
    questionDiv.appendChild(questionLabel);

    options.forEach((option, optionIndex) => {
      const optionLabel = document.createElement('label');
      optionLabel.classList.add('option');

      const optionInput = document.createElement('input');
      optionInput.type = 'radio';
      optionInput.name = `question-${mcqContent.childElementCount}`;
      optionInput.value = option.slice(0, 1).toUpperCase(); // Ensure it's uppercase

      optionLabel.appendChild(optionInput);
      optionLabel.appendChild(document.createTextNode(option));

      questionDiv.appendChild(optionLabel);
      questionDiv.appendChild(document.createElement('br'));
    });

    mcqContent.appendChild(questionDiv);
  }

  function checkAnswers() {
    const userAnswers = [];
    const questions = document.querySelectorAll('.question');

    questions.forEach((question, index) => {
      const selectedOption = question.querySelector('input[name="question-' + index + '"]:checked');
      const userAnswer = selectedOption ? selectedOption.value : 'None';
      userAnswers.push(userAnswer);
    });

    displayAnswers(userAnswers);
  }

  function displayAnswers(userAnswers) {
    answersContent.innerHTML = '';

    userAnswers.forEach((userAnswer, index) => {
      const answerDiv = document.createElement('div');
      answerDiv.classList.add('answer');

      const questionNumber = document.createElement('p');
      questionNumber.textContent = `Question ${index + 1}:`;
      answerDiv.appendChild(questionNumber);

      const userAnswerText = document.createElement('p');
      userAnswerText.textContent = `Your Answer: ${userAnswer}`;
      answerDiv.appendChild(userAnswerText);

      const correctAnswerText = document.createElement('p');
      correctAnswerText.textContent = `Correct Answer: ${correctAnswers[index]}`;
      answerDiv.appendChild(correctAnswerText);

      if (userAnswer !== correctAnswers[index]) {
        answerDiv.classList.add('wrong');
      } else {
        answerDiv.classList.add('correct');
      }

      answersContent.appendChild(answerDiv);
    });
  }

  function handleError(error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
    loadingSpinner.classList.add('hidden'); 
  }
});

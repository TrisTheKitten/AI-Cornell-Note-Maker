document.addEventListener('DOMContentLoaded', () => {
  const apiKey = localStorage.getItem('apiKey');
  const backBtn = document.getElementById('back-btn');
  const generateMindmapBtn = document.getElementById('generate-mindmap-btn');
  const loadingSpinner = document.getElementById('loading-spinner');
  const contextInput = document.getElementById('context');
  const mindmapContainer = document.getElementById('mindmap-container');
  const notification = document.getElementById('notification');

  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  generateMindmapBtn.addEventListener('click', () => {
    const context = contextInput.value.trim();

    if (!apiKey || context === '') {
      alert('API key or context is missing. Please provide the required inputs.');
      return;
    }

    generateMindmap(context);
  });

  async function generateMindmap(context) {
    loadingSpinner.classList.remove('hidden');
    showNotification('Generating mindmap...', 'info');
  
    const prompt = `Based on the following context, generate a mindmap outline with keywords and their relationships. Use a hierarchical structure with main keywords and subkeywords. Format the response as an indented list, where the indentation level represents the hierarchy. Use the following format:
  
  - Main Keyword 1
    - Subkeyword 1
    - Subkeyword 2
  - Main Keyword 2
    - Subkeyword 1
    - Subkeyword 2
  
  Context:
  ${context}
  
  Mindmap Outline:`;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that generates mindmap outlines based on the given context.',
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
  
      const mindmapText = response.data.choices[0].message.content.trim();
      console.log('Generated Mindmap Text:', mindmapText); // Log the generated mindmap text
      const mindmapData = parseMindmapText(mindmapText);
      displayMindmap(mindmapData);
      showNotification('Mindmap generated successfully!', 'success');
    } catch (error) {
      handleError(error);
    } finally {
      loadingSpinner.classList.add('hidden');
    }
  }

  function parseMindmapText(mindmapText) {
    const lines = mindmapText.split('\n').filter(line => line.trim() !== '');
    const mindmapData = [];
    let currentLevel = 0;
    let currentParent = null;
  
    lines.forEach((line) => {
      const level = line.search(/\S/) / 2;
      const label = line.trim().replace(/^-\s*/, '');
  
      const node = {
        id: mindmapData.length + 1,
        label: label,
        level: level,
      };
  
      if (level > currentLevel) {
        currentParent = mindmapData[mindmapData.length - 1];
      } else if (level < currentLevel) {
        while (currentParent && currentParent.level >= level) {
          currentParent = mindmapData.find(item => item.id === currentParent.parent);
        }
      }
  
      if (currentParent) {
        node.parent = currentParent.id;
      }
  
      mindmapData.push(node);
      currentLevel = level;
    });
  
    return mindmapData;
  }

  function displayMindmap(mindmapData) {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b', '#000000'
    ];
  
    const nodes = new vis.DataSet(
      mindmapData.map((item, index) => ({
        id: item.id,
        label: item.label,
        level: item.level,
        color: {
          background: colors[index % colors.length],
          border: '#ffffff',
          highlight: {
            background: colors[index % colors.length],
            border: '#ffffff'
          },
          hover: {
            background: colors[index % colors.length],
            border: '#ffffff'
          }
        },
        font: {
          color: '#ffffff',
          size: 14,
          face: 'Arial',
          strokeWidth: 0,
          strokeColor: '#ffffff'
        },
        shape: 'box',
        margin: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        },
        widthConstraint: {
          maximum: 200
        }
      }))
    );
  
    const edges = new vis.DataSet(
      mindmapData
        .filter((item) => item.parent)
        .map((item) => ({
          from: item.parent,
          to: item.id,
          arrows: 'to',
          color: {
            color: '#000000',
            highlight: '#000000',
            hover: '#000000'
          },
          smooth: {
            type: 'curvedCW',
            roundness: 0.2
          }
        }))
    );
  

    const container = document.getElementById('mindmap-container');
    const data = {
      nodes: nodes,
      edges: edges
    };
    const options = {
      layout: {
        hierarchical: false,
        randomSeed: 1,
        improvedLayout: true,
        clusterThreshold: 150,
        nodeSpacing: 400,
        edgeLength: 200
      },
      nodes: {
        shape: 'box',
        font: {
          size: 50,
        }
      },
      edges: {
        smooth: {
          type: 'curvedCW',
          roundness: 0.2
        }
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -15000,
          centralGravity: 0.8,
          springLength: 250,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.5
        },
        solver: 'barnesHut',
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 100,
          onlyDynamicEdges: false,
          fit: true
        }
      },
      width: '100%',
      height: '100%',
      autoResize: true
    };
    new vis.Network(container, data, options);
  }

  function handleError(error) {
    console.error('Error generating mindmap:', error);
    showNotification('Error generating mindmap. Please try again.', 'error');
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

const API_URL = 'http://localhost:3000/api/chat';
const WELCOME =
  'Hola, soy el asistente de Cuadrio. Puedo responder sobre tus clientes, obligaciones, documentos y cobranza. ¿En qué te ayudo?';

let conversationHistory = [];
let isLoading = false;

async function sendMessage(textOverride) {
  const inputField = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatBox = document.getElementById('chatBox');
  const text = (typeof textOverride === 'string' ? textOverride : inputField.value).trim();
  if (!text || isLoading) return;

  hideSuggestions();
  appendMessage(text, 'user');
  inputField.value = '';
  conversationHistory.push({ role: 'user', content: text });

  // Bloquear la interfaz y mostrar el indicador "pensando"
  isLoading = true;
  inputField.disabled = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: conversationHistory.slice(0, -1) // historial previo
      })
    });

    const data = await response.json();
    removeTyping();

    if (data.reply) {
      appendMessage(data.reply, 'assistant');
      conversationHistory.push({ role: 'assistant', content: data.reply });
    } else {
      appendMessage('Error: ' + (data.error || 'No se pudo obtener respuesta del servidor.'), 'assistant');
      conversationHistory.pop(); // quita el mensaje fallido del historial
    }
  } catch (error) {
    console.error('Error de red:', error);
    removeTyping();
    appendMessage('Error de conexión con el servidor.', 'assistant');
    conversationHistory.pop();
  } finally {
    isLoading = false;
    inputField.disabled = false;
    sendBtn.disabled = false;
    inputField.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

function sendSuggestion(button) {
  sendMessage(button.textContent);
}

function appendMessage(text, sender) {
  const chatBox = document.getElementById('chatBox');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  if (sender === 'assistant') {
    // Escapar HTML (seguridad) y convertir **negrita** en <strong>
    messageDiv.innerHTML = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  } else {
    messageDiv.textContent = text;
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const chatBox = document.getElementById('chatBox');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typingIndicator';
  typingDiv.className = 'message assistant typing';
  typingDiv.innerHTML = '<span></span><span></span><span></span>';
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typingDiv = document.getElementById('typingIndicator');
  if (typingDiv) typingDiv.remove();
}

function hideSuggestions() {
  const s = document.getElementById('suggestions');
  if (s) s.style.display = 'none';
}

function resetChat() {
  if (isLoading) return;
  conversationHistory = [];
  document.getElementById('chatBox').innerHTML = '';
  const s = document.getElementById('suggestions');
  if (s) s.style.display = 'flex';
  appendMessage(WELCOME, 'assistant');
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Mensaje de bienvenida al cargar la página
appendMessage(WELCOME, 'assistant');

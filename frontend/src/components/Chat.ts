import { getAuthState } from '../services/authService';
import { OFFLINE_MODE } from '../config';

// Message storage for offline mode chats (key: gameId)
const offlineMessages: Record<string, { sender: string, text: string, timestamp: Date }[]> = {};

// Enhanced chat component
export const renderChat = (container: HTMLElement, gameId: string): void => {
  const { user } = getAuthState();
  
  // Get or initialize chat messages for this game
  if (OFFLINE_MODE && !offlineMessages[gameId]) {
    offlineMessages[gameId] = [
      {
        sender: 'system',
        text: 'Game started',
        timestamp: new Date()
      },
      {
        sender: user?.username || 'You',
        text: 'Hello, ready to play?',
        timestamp: new Date(Date.now() - 60000) // 1 minute ago
      },
      {
        sender: 'Opponent',
        text: 'Yes, let\'s start!',
        timestamp: new Date(Date.now() - 30000) // 30 seconds ago
      }
    ];
  }
  
  // Create chat HTML
  container.innerHTML = `
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-title text-lg">Game Chat</h3>
        <span class="text-xs px-2 py-1 ${OFFLINE_MODE ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-success'} rounded-full">
          ${OFFLINE_MODE ? 'Offline' : 'Live'}
        </span>
      </div>
      
      <div id="chat-messages-${gameId}" class="chat-messages bg-white p-3 h-60 rounded-lg overflow-y-auto mb-3 border">
        <div class="space-y-3">
          ${OFFLINE_MODE 
            ? renderOfflineMessages(gameId, user?.username || 'You')
            : `
              <div class="chat-system-message">
                <div class="text-center text-xs pencil-text py-1">Game started</div>
              </div>
              
              <div class="chat-message">
                <div class="flex items-start mb-2">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold mr-2">
                    ${user?.username?.slice(0, 1).toUpperCase() || 'U'}
                  </div>
                  <div class="highlight rounded-lg p-2 max-w-[80%]">
                    <div class="text-xs font-handwritten mb-1">${user?.username || 'You'}</div>
                    <div class="text-sm">Hello, ready to play?</div>
                  </div>
                </div>
              </div>
              
              <div class="chat-message">
                <div class="flex items-start justify-end mb-2">
                  <div class="highlight rounded-lg p-2 max-w-[80%]">
                    <div class="text-xs font-handwritten mb-1">Opponent</div>
                    <div class="text-sm">Yes, let's start!</div>
                  </div>
                  <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-secondary font-bold ml-2">
                    O
                  </div>
                </div>
              </div>
              
              <div class="chat-system-message">
                <div class="text-center text-xs pencil-text py-1">Chat will be available once the backend is connected</div>
              </div>
            `
          }
        </div>
      </div>
      
      <div class="chat-input-container flex">
        <input 
          id="chat-input-${gameId}"
          type="text" 
          class="input flex-grow rounded-r-none"
          placeholder="Type a message..."
          ${OFFLINE_MODE ? '' : 'disabled'}
        >
        <button 
          id="chat-send-${gameId}"
          class="btn btn-primary rounded-l-none ${OFFLINE_MODE ? '' : 'opacity-50 cursor-not-allowed'} flex items-center"
          ${OFFLINE_MODE ? '' : 'disabled'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners for offline mode chat
  if (OFFLINE_MODE) {
    const chatInput = document.getElementById(`chat-input-${gameId}`) as HTMLInputElement;
    const chatSendButton = document.getElementById(`chat-send-${gameId}`);
    
    if (chatInput && chatSendButton) {
      // Send button click
      chatSendButton.addEventListener('click', () => {
        sendOfflineMessage(gameId, chatInput, user?.username || 'You');
      });
      
      // Enter key press
      chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          sendOfflineMessage(gameId, chatInput, user?.username || 'You');
        }
      });
    }
  }
};

// Helper function to render offline messages
function renderOfflineMessages(gameId: string, username: string): string {
  if (!offlineMessages[gameId]) return '';
  
  return offlineMessages[gameId].map(message => {
    if (message.sender === 'system') {
      return `
        <div class="chat-system-message">
          <div class="text-center text-xs pencil-text py-1">${message.text}</div>
        </div>
      `;
    } else if (message.sender === username) {
      return `
        <div class="chat-message">
          <div class="flex items-start mb-2">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold mr-2">
              ${message.sender.slice(0, 1).toUpperCase()}
            </div>
            <div class="highlight rounded-lg p-2 max-w-[80%]">
              <div class="text-xs font-handwritten mb-1">${message.sender}</div>
              <div class="text-sm">${message.text}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="chat-message">
          <div class="flex items-start justify-end mb-2">
            <div class="highlight rounded-lg p-2 max-w-[80%]">
              <div class="text-xs font-handwritten mb-1">${message.sender}</div>
              <div class="text-sm">${message.text}</div>
            </div>
            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-secondary font-bold ml-2">
              ${message.sender.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      `;
    }
  }).join('');
}

// Helper function to send an offline message
function sendOfflineMessage(gameId: string, inputElement: HTMLInputElement, senderName: string): void {
  const messageText = inputElement.value.trim();
  
  if (!messageText) return;
  
  // Add message to storage
  if (!offlineMessages[gameId]) {
    offlineMessages[gameId] = [];
  }
  
  // Add user message
  offlineMessages[gameId].push({
    sender: senderName,
    text: messageText,
    timestamp: new Date()
  });
  
  // Clear input
  inputElement.value = '';
  
  // Update chat display
  const chatMessagesElement = document.getElementById(`chat-messages-${gameId}`);
  if (chatMessagesElement) {
    chatMessagesElement.innerHTML = `<div class="space-y-3">${renderOfflineMessages(gameId, senderName)}</div>`;
    // Scroll to bottom
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
  }
  
  // Add "opponent" response after a delay in 50% of cases
  if (Math.random() > 0.5) {
    setTimeout(() => {
      const responses = [
        "Good move!",
        "I see what you're doing there...",
        "Interesting strategy!",
        "Let me think about this...",
        "Nice try!",
        "Hmm, now what should I do?",
        "I'm going to win this one!",
        "You're pretty good at this!",
        "That was unexpected!",
        "Let's see how this plays out."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Add bot message
      offlineMessages[gameId].push({
        sender: 'Opponent',
        text: randomResponse,
        timestamp: new Date()
      });
      
      // Update chat display
      if (chatMessagesElement) {
        chatMessagesElement.innerHTML = `<div class="space-y-3">${renderOfflineMessages(gameId, senderName)}</div>`;
        // Scroll to bottom
        chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
      }
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  }
} 
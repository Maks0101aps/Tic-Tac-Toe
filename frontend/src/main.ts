import './style.css'
import { renderHomePage } from './components/HomePage'
import { initializeSocketConnection } from './services/socketService'
import { initAuth, getAuthState } from './services/authService'
import { OFFLINE_MODE } from './config'
import { renderNavbar, addNavbarStyles } from './components/Navbar'

// Initialize the application
const initApp = async () => {
  const appContainer = document.querySelector<HTMLDivElement>('#app')
  
  if (appContainer) {
    // Remove loading indicator
    const loadingElement = document.getElementById('loading')
    if (loadingElement) {
      loadingElement.remove()
    }
    
    try {
      // Initialize authentication from stored tokens
      await initAuth()
      
      // Add navbar styles
      addNavbarStyles()
      
      // Add navbar
      const navbar = renderNavbar()
      document.body.insertBefore(navbar, appContainer)
      
      // Initialize socket connection (will be skipped in offline mode)
      initializeSocketConnection()
      
      // Check for URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const joinGameId = urlParams.get('join')
      
      // Add Easter egg key sequence detector
      addEasterEgg()
      
      if (joinGameId) {
        // Clear URL parameters but keep the path
        const url = new URL(window.location.href)
        url.search = ''
        window.history.replaceState({}, document.title, url.toString())
        
        // If user is logged in, join the game
        if (getAuthState().isAuthenticated) {
          // Import and render directly to avoid circular imports
          const { renderGamePage } = await import('./components/GamePage')
          renderGamePage(appContainer, 'join', joinGameId)
          console.log(`Joining game: ${joinGameId}`)
        } else {
          // Show login screen with message
          renderHomePage(appContainer)
          setTimeout(() => {
            alert(`Please log in or register first, then you can join game: ${joinGameId}`)
          }, 500)
        }
      } else {
        // Render the home page
        renderHomePage(appContainer)
      }
    } catch (error) {
      console.error('Failed to initialize the application:', error)
      appContainer.innerHTML = `
        <div class="flex flex-col justify-center items-center h-screen gap-4">
          <div class="text-error text-2xl font-handwritten">
            Failed to load the application.
          </div>
          <p class="text-center">
            ${error instanceof Error ? error.message : 'Unknown error occurred.'}
          </p>
          <button id="retry-button" class="btn btn-primary mt-4">
            Retry
          </button>
          <button id="offline-button" class="btn btn-secondary mt-2">
            Use Offline Mode
          </button>
        </div>
      `
      
      // Add button event listeners
      const retryButton = document.getElementById('retry-button')
      if (retryButton) {
        retryButton.addEventListener('click', () => window.location.reload())
      }
      
      const offlineButton = document.getElementById('offline-button')
      if (offlineButton) {
        offlineButton.addEventListener('click', () => {
          // Set offline mode in local storage and reload
          localStorage.setItem('offline_mode', 'true')
          window.location.reload()
        })
      }
    }
  }
}

// Add an Easter egg key sequence detector for "maks"
const addEasterEgg = () => {
  const pattern = ['m', 'a', 'k', 's']
  let current = 0

  // Add modal styles
  const styleElement = document.createElement('style')
  styleElement.textContent = `
    .maks-modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.7);
      animation: fadeIn 0.3s;
    }
    
    .maks-modal.show {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .maks-modal-content {
      background-color: #fff8e8;
      margin: auto;
      padding: 20px;
      border: 1px solid #888;
      width: 80%;
      max-width: 500px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      animation: scaleIn 0.3s;
      position: relative;
      border-radius: 8px;
      background-image: linear-gradient(#f5f5f5 1px, transparent 1px);
      background-size: 100% 25px;
    }
    
    .maks-close {
      color: #aaa;
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      position: absolute;
      right: 15px;
      top: 10px;
    }
    
    .maks-close:hover {
      color: black;
    }
    
    @keyframes fadeIn {
      from {opacity: 0;}
      to {opacity: 1;}
    }
    
    @keyframes scaleIn {
      from {transform: scale(0.8); opacity: 0;}
      to {transform: scale(1); opacity: 1;}
    }
    
    .pencil-highlight {
      background-color: rgba(255, 255, 0, 0.3);
      padding: 2px 4px;
      border-radius: 4px;
    }
  `
  document.head.appendChild(styleElement)

  // Create the modal HTML
  const modalElement = document.createElement('div')
  modalElement.className = 'maks-modal'
  modalElement.innerHTML = `
    <div class="maks-modal-content card">
      <span class="maks-close">&times;</span>
      <h2 class="font-title text-center text-2xl mb-4">🎉 You found an Easter egg! 🎉</h2>
      <p class="font-handwritten text-center mb-6">You've discovered the secret code!</p>
      <div class="text-center mb-6">
        <p>This Tic-Tac-Toe game was created by:</p>
        <p class="text-xl font-bold mt-2 pencil-highlight">Maks0101aps</p>
        <p class="mt-4">Check out my other projects on GitHub:</p>
        <a href="https://github.com/Maks0101aps" target="_blank" class="btn btn-primary mt-2 inline-block">
          Visit GitHub Profile
        </a>
      </div>
    </div>
  `
  document.body.appendChild(modalElement)

  // Set up close modal functionality
  const closeButton = modalElement.querySelector('.maks-close')
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modalElement.classList.remove('show')
    })
  }

  // Close modal when clicking outside of modal content
  modalElement.addEventListener('click', (event) => {
    if (event.target === modalElement) {
      modalElement.classList.remove('show')
    }
  })

  // Key press handler
  const keyHandler = (event: KeyboardEvent) => {
    // Only process when not typing in input/textarea
    if (
      document.activeElement?.tagName === 'INPUT' || 
      document.activeElement?.tagName === 'TEXTAREA'
    ) {
      return
    }

    // Reset if the pressed key doesn't match the current expected key
    if (event.key !== pattern[current]) {
      current = 0
      return
    }

    // Move to the next key in the pattern
    current++

    // Check if the full pattern has been entered
    if (current === pattern.length) {
      console.log('Easter egg activated!')
      modalElement.classList.add('show')
      current = 0 // Reset the pattern
    }
  }

  // Attach the key handler
  document.addEventListener('keydown', keyHandler)
}

// Start the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(error => {
    console.error('Unhandled application error:', error)
  })
})

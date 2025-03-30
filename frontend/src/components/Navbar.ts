import { getAuthState } from '../services/authService';
import { OFFLINE_MODE, toggleOfflineMode, getOfflineModeStatus } from '../config';

export const renderNavbar = (): HTMLElement => {
  const { isAuthenticated, user } = getAuthState();
  const navbarElement = document.createElement('nav');
  navbarElement.className = 'navbar bg-primary text-white shadow-md mb-6';
  
  const offlineStatus = getOfflineModeStatus();
  
  navbarElement.innerHTML = `
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="text-xl font-bold mr-6">Tic-Tac-Toe Online</h1>
        <a href="#" id="home-link" class="mr-4 hover:underline">Home</a>
      </div>
      
      <div class="flex items-center">
        <div class="flex items-center mr-6">
          <div class="mr-2 text-xs md:text-sm">
            <span class="${OFFLINE_MODE ? 'text-yellow-300' : 'text-green-300'}">${offlineStatus}</span>
          </div>
          <label class="switch">
            <input type="checkbox" id="offline-toggle" ${OFFLINE_MODE ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
        </div>
        
        ${isAuthenticated && user ? `
          <span class="mr-4 text-sm hidden md:inline-block">Hello, ${user.username}</span>
        ` : `
          <a href="#" id="login-link" class="mr-4 hover:underline">Login</a>
        `}
      </div>
    </div>
  `;
  
  // Add event listeners
  setTimeout(() => {
    const homeLink = navbarElement.querySelector('#home-link');
    const loginLink = navbarElement.querySelector('#login-link');
    const offlineToggle = navbarElement.querySelector('#offline-toggle') as HTMLInputElement;
    
    if (homeLink) {
      homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/';
      });
    }
    
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/';
      });
    }
    
    if (offlineToggle) {
      offlineToggle.addEventListener('change', () => {
        toggleOfflineMode(offlineToggle.checked);
      });
    }
  }, 0);
  
  return navbarElement;
};

// CSS for the toggle switch
export const addNavbarStyles = (): void => {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Toggle Switch Styles */
    .switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
    }
    
    input:checked + .slider {
      background-color: #ffd700;
    }
    
    input:focus + .slider {
      box-shadow: 0 0 1px #ffd700;
    }
    
    input:checked + .slider:before {
      transform: translateX(16px);
    }
    
    .slider.round {
      border-radius: 34px;
    }
    
    .slider.round:before {
      border-radius: 50%;
    }
  `;
  document.head.appendChild(styleElement);
}; 
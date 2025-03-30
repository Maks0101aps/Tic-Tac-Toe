// Render login form
export const renderLoginForm = (container: HTMLElement, onSubmit: (email: string, password: string) => void): void => {
  container.innerHTML = `
    <form id="login-form" class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-handwritten mb-1">Email address</label>
        <input type="email" id="email" name="email" required class="input">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-handwritten mb-1">Password</label>
        <input type="password" id="password" name="password" required class="input">
      </div>
      
      <div>
        <button type="submit" class="btn btn-primary w-full">
          Sign in
        </button>
      </div>
    </form>
  `;
  
  // Add form submission handler
  const form = document.getElementById('login-form') as HTMLFormElement;
  
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      onSubmit(email, password);
    });
  }
};

// Render register form
export const renderRegisterForm = (container: HTMLElement, onSubmit: (username: string, email: string, password: string) => void): void => {
  container.innerHTML = `
    <form id="register-form" class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-handwritten mb-1">Username</label>
        <input type="text" id="username" name="username" required class="input">
      </div>
      
      <div>
        <label for="email" class="block text-sm font-handwritten mb-1">Email address</label>
        <input type="email" id="email" name="email" required class="input">
      </div>
      
      <div>
        <label for="password" class="block text-sm font-handwritten mb-1">Password</label>
        <input type="password" id="password" name="password" required minlength="6" class="input">
        <p class="mt-1 text-xs pencil-text">Password must be at least 6 characters</p>
      </div>
      
      <div>
        <button type="submit" class="btn btn-primary w-full">
          Create account
        </button>
      </div>
    </form>
  `;
  
  // Add form submission handler
  const form = document.getElementById('register-form') as HTMLFormElement;
  
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const username = (document.getElementById('username') as HTMLInputElement).value;
      const email = (document.getElementById('email') as HTMLInputElement).value;
      const password = (document.getElementById('password') as HTMLInputElement).value;
      
      onSubmit(username, email, password);
    });
  }
}; 
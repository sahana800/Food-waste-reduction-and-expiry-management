/* Same-browser demo accounts. This is not a server-backed security system. */
(function () {
  const accountsKey = 'freshtrack_local_accounts_v1';
  const sessionKey = 'freshtrack_local_session_v1';
  const iterations = 210000;
  const basePrefs = { reminders: false, days: '3' };
  const accountPrefix = id => `freshtrack_account_${id}_`;
  let authMode = 'signin';
  let activeAccount = null;

  const $ = id => document.getElementById(id);
  const message = text => { $('authStatus').textContent = text; };
  const readJson = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value == null ? fallback : value;
    } catch { return fallback; }
  };
  const getAccounts = () => readJson(accountsKey, []);
  const toBase64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const fromBase64 = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));

  async function passwordHash(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
    return toBase64(bits);
  }

  function toggleMode(next) {
    authMode = next;
    const signup = next === 'signup';
    $('authNameWrap').classList.toggle('hidden', !signup);
    $('authName').required = signup;
    $('authPasswordConfirmWrap').classList.toggle('hidden', !signup);
    $('authPasswordConfirm').required = signup;
    $('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    $('authTitle').textContent = signup ? 'Create your FreshTrack account' : 'Sign in to FreshTrack';
    $('authSubmit').textContent = signup ? 'Create account' : 'Sign in';
    $('authModeBtn').textContent = signup ? 'I already have an account' : 'Create account';
    message('');
  }

  function saveAccountList(accounts) {
    localStorage.setItem(accountsKey, JSON.stringify(accounts));
  }

  function persistAccountData() {
    if (!activeAccount) return;
    const prefix = accountPrefix(activeAccount.id);
    localStorage.setItem(prefix + 'foods', JSON.stringify(foods));
    localStorage.setItem(prefix + 'donations', JSON.stringify(donations));
    localStorage.setItem(prefix + 'profile', JSON.stringify(profile));
    localStorage.setItem(prefix + 'shopping', JSON.stringify(shopping));
    localStorage.setItem(prefix + 'waste', JSON.stringify(waste));
    localStorage.setItem(prefix + 'prefs', JSON.stringify(prefs));
    const accounts = getAccounts();
    const account = accounts.find(item => item.id === activeAccount.id);
    if (account) {
      account.name = profile.name || account.name;
      activeAccount.name = account.name;
      saveAccountList(accounts);
    }
  }

  function loadAccountData(account, preserveExisting) {
    const prefix = accountPrefix(account.id);
    if (!preserveExisting) {
      foods = readJson(prefix + 'foods', []);
      donations = readJson(prefix + 'donations', []);
      profile = readJson(prefix + 'profile', { name: account.name, household: '', location: '' });
      shopping = readJson(prefix + 'shopping', []);
      waste = readJson(prefix + 'waste', []);
      prefs = { ...basePrefs, ...readJson(prefix + 'prefs', {}) };
    } else {
      profile = { ...profile, name: profile.name || account.name };
    }
    activeAccount = account;
    window.FRESHTRACK_ACCOUNT_ACTIVE = true;
    window.FRESHTRACK_SAVE = persistAccountData;
    $('accountLabel').textContent = account.email;
    document.documentElement.classList.remove('account-required');
    $('authGate').classList.add('hidden');
    document.body.classList.add('account-active');
    $('localModeNotice').classList.remove('hidden');
    if (preserveExisting) persistAccountData();
    if (!window.FRESHTRACK_REMINDER_TIMER) window.FRESHTRACK_REMINDER_TIMER = setInterval(checkReminders, 60000);
    render();
    loadProfile();
  }

  function signOut(showMessage) {
    activeAccount = null;
    localStorage.removeItem(sessionKey);
    window.FRESHTRACK_ACCOUNT_ACTIVE = false;
    window.FRESHTRACK_SAVE = null;
    foods = [];
    donations = [];
    profile = {};
    shopping = [];
    waste = [];
    prefs = { ...basePrefs };
    document.body.classList.remove('account-active');
    document.documentElement.classList.add('account-required');
    $('accountLabel').textContent = '';
    $('authGate').classList.remove('hidden');
    $('authForm').reset();
    toggleMode('signin');
    if (showMessage) message(showMessage);
  }

  $('authForm').addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('authEmail').value.trim().toLowerCase();
    const password = $('authPassword').value;
    const button = $('authSubmit');
    button.disabled = true;
    try {
      if (!crypto?.subtle) throw new Error('Open FreshTrack at http://localhost:8000 to set up an account.');
      const accounts = getAccounts();
      if (authMode === 'signup') {
        const name = $('authName').value.trim();
        if (!name) throw new Error('Enter your name.');
        if (password !== $('authPasswordConfirm').value) throw new Error('The passwords do not match.');
        if (accounts.some(account => account.email === email)) throw new Error('An account with this email already exists. Sign in instead.');
        message('Creating your account…');
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const account = {
          id: crypto.randomUUID(), email, name,
          salt: toBase64(salt),
          hash: await passwordHash(password, salt),
          iterations,
          createdAt: new Date().toISOString()
        };
        saveAccountList([...accounts, account]);
        localStorage.setItem(sessionKey, account.id);
        loadAccountData(account, accounts.length === 0);
        $('authPassword').value = '';
        $('authPasswordConfirm').value = '';
      } else {
        message('Signing in…');
        const account = accounts.find(item => item.email === email);
        if (!account) throw new Error('No account found for this email. Choose Create account to get started.');
        const actual = await passwordHash(password, fromBase64(account.salt));
        if (actual !== account.hash) throw new Error('That password doesn’t match. Try again.');
        localStorage.setItem(sessionKey, account.id);
        loadAccountData(account, false);
        $('authPassword').value = '';
      }
    } catch (error) {
      message(error.message || 'Could not complete account setup.');
    } finally {
      button.disabled = false;
    }
  });

  $('authModeBtn').addEventListener('click', () => toggleMode(authMode === 'signin' ? 'signup' : 'signin'));
  $('signOutBtn').addEventListener('click', () => signOut('You are signed out.'));

  const savedId = localStorage.getItem(sessionKey);
  const savedAccount = getAccounts().find(account => account.id === savedId);
  if (savedAccount) loadAccountData(savedAccount, false);
  else {
    localStorage.removeItem(sessionKey);
    window.FRESHTRACK_ACCOUNT_ACTIVE = false;
    window.FRESHTRACK_SAVE = null;
    document.body.classList.remove('account-active');
    document.documentElement.classList.add('account-required');
    $('authGate').classList.remove('hidden');
    toggleMode('signin');
    message('Create an account or sign in to continue.');
  }
})();

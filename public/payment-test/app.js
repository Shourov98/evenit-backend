const tokenStorageKey = 'evenit-payment-test-token';
const paymentAttemptStorageKey = 'evenit-payment-attempt';

const state = {
  user: null,
  subscription: null,
  paymentLink: '',
  pollTimer: null,
  pollCount: 0
};

const elements = {
  loginForm: document.getElementById('login-form'),
  logoutButton: document.getElementById('logout-button'),
  refreshButton: document.getElementById('refresh-button'),
  subscribeButton: document.getElementById('subscribe-button'),
  logOutput: document.getElementById('log-output'),
  resultBadge: document.getElementById('result-badge'),
  subscriptionMessage: document.getElementById('subscription-message'),
  userName: document.getElementById('user-name'),
  userEmail: document.getElementById('user-email'),
  summaryRole: document.getElementById('summary-role'),
  summaryPlan: document.getElementById('summary-plan'),
  summaryStatus: document.getElementById('summary-status'),
  detailPrice: document.getElementById('detail-price'),
  detailPaymentStatus: document.getElementById('detail-payment-status'),
  detailActivatedAt: document.getElementById('detail-activated-at'),
  detailPaidAt: document.getElementById('detail-paid-at')
};

const formatJson = (value) => JSON.stringify(value, null, 2);

const setLog = (message, detail) => {
  elements.logOutput.textContent = detail ? `${message}\n\n${formatJson(detail)}` : message;
};

const getToken = () => localStorage.getItem(tokenStorageKey) || '';

const setToken = (token) => {
  if (token) {
    localStorage.setItem(tokenStorageKey, token);
    return;
  }

  localStorage.removeItem(tokenStorageKey);
};

const setPaymentAttempt = (attempt) => {
  if (!attempt) {
    sessionStorage.removeItem(paymentAttemptStorageKey);
    return;
  }

  sessionStorage.setItem(paymentAttemptStorageKey, JSON.stringify(attempt));
};

const getPaymentAttempt = () => {
  const raw = sessionStorage.getItem(paymentAttemptStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    sessionStorage.removeItem(paymentAttemptStorageKey);
    return null;
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const formatPrice = (subscription) => {
  if (!subscription?.payment) {
    return '-';
  }

  const amount = (subscription.payment.amount / 100).toFixed(2);
  return `${subscription.payment.currency} ${amount} / ${subscription.payment.billingCycle}`;
};

const stopPolling = () => {
  if (state.pollTimer) {
    window.clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
  state.pollCount = 0;
};

const setResultState = (variant, message) => {
  elements.resultBadge.className = `result-badge ${variant}`;
  elements.resultBadge.textContent = message;
};

const render = () => {
  const user = state.user;
  const subscription = state.subscription;
  const isSubscribed = subscription?.status === 'subscribed';

  elements.userName.textContent = user?.fullName || 'Not logged in';
  elements.userEmail.textContent = user?.email || 'Please login to continue.';
  elements.summaryRole.textContent = user?.role || '-';
  elements.summaryPlan.textContent = subscription?.plan || '-';
  elements.summaryStatus.textContent = subscription?.status || '-';
  elements.detailPrice.textContent = formatPrice(subscription);
  elements.detailPaymentStatus.textContent = subscription?.payment?.status || '-';
  elements.detailActivatedAt.textContent = formatDateTime(subscription?.activatedAt);
  elements.detailPaidAt.textContent = formatDateTime(subscription?.payment?.paidAt);

  if (!user) {
    setResultState('result-neutral', 'Waiting for login');
    elements.subscriptionMessage.textContent =
      'Login first. The page will then show the subscription plan for that user.';
    elements.subscribeButton.disabled = true;
    return;
  }

  if (isSubscribed) {
    setResultState('result-success', 'Payment successful');
    elements.subscriptionMessage.textContent =
      'This user is already subscribed. No further payment is required.';
    elements.subscribeButton.disabled = true;
    return;
  }

  const attempt = getPaymentAttempt();
  if (attempt && attempt.email === user.email) {
    setResultState('result-pending', 'Checking payment');
    elements.subscriptionMessage.textContent =
      'We are checking whether the Stripe payment completed for this user.';
  } else {
    setResultState('result-neutral', 'Not subscribed');
    elements.subscriptionMessage.textContent =
      'This user is not subscribed. Click subscribe to continue to Stripe checkout.';
  }

  elements.subscribeButton.disabled = false;
};

const handleResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }

  return body;
};

const apiRequest = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  return handleResponse(response);
};

const loadCurrentUser = async ({ silent = false } = {}) => {
  try {
    const response = await apiRequest('/api/v1/auth/me', { method: 'GET' });
    state.user = response.data;
    state.subscription = response.data.subscription || null;
    render();

    if (!silent) {
      setLog('Loaded current user subscription state.', response.data);
    }

    const attempt = getPaymentAttempt();
    if (attempt && attempt.email === state.user?.email && state.subscription?.status === 'subscribed') {
      setPaymentAttempt(null);
      stopPolling();
      setResultState('result-success', 'Payment successful');
      elements.subscriptionMessage.textContent =
        'Payment successful. This user is now subscribed.';
      setLog('Stripe payment completed and the user is subscribed.', response.data);
    }

    return response.data;
  } catch (error) {
    state.user = null;
    state.subscription = null;
    render();

    if (!silent) {
      setLog(error.message);
    }

    throw error;
  }
};

const fetchPaymentLink = async () => {
  const response = await apiRequest('/api/v1/subscriptions/payment-link', { method: 'GET' });
  state.paymentLink = response.data.paymentLink;
  return response.data;
};

const beginPaymentCheck = () => {
  stopPolling();
  state.pollCount = 0;

  state.pollTimer = window.setInterval(async () => {
    state.pollCount += 1;

    try {
      await loadCurrentUser({ silent: true });

      if (state.subscription?.status === 'subscribed') {
        return;
      }

      if (state.pollCount >= 24) {
        stopPolling();
        setPaymentAttempt(null);
        setResultState('result-failed', 'Payment failed');
        elements.subscriptionMessage.textContent =
          'Payment failed or was not completed for this user.';
        setLog('Payment was not confirmed for the user within the expected time window.');
      }
    } catch (_error) {
      stopPolling();
    }
  }, 5000);
};

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  try {
    const response = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(response.data.token);
    setLog('Logged in successfully. Loading subscription details for this user.', response.data);
    await loadCurrentUser({ silent: true });
  } catch (error) {
    setLog(error.message);
  }
});

elements.logoutButton.addEventListener('click', () => {
  stopPolling();
  setToken('');
  setPaymentAttempt(null);
  state.user = null;
  state.subscription = null;
  state.paymentLink = '';
  render();
  setLog('Logged out.');
});

elements.refreshButton.addEventListener('click', async () => {
  try {
    await loadCurrentUser();
  } catch (_error) {
    // handled by loadCurrentUser
  }
});

elements.subscribeButton.addEventListener('click', async () => {
  try {
    if (!state.user) {
      throw new Error('Login first before starting payment.');
    }

    const paymentLinkData = await fetchPaymentLink();
    setPaymentAttempt({
      email: state.user.email,
      startedAt: Date.now()
    });
    render();
    setLog('Redirecting to Stripe checkout for the logged-in user.', paymentLinkData);
    window.location.assign(paymentLinkData.paymentLink);
  } catch (error) {
    setLog(error.message);
  }
});

window.addEventListener('focus', async () => {
  const attempt = getPaymentAttempt();
  if (!attempt || !getToken()) {
    return;
  }

  try {
    await loadCurrentUser({ silent: true });
    if (state.subscription?.status !== 'subscribed') {
      beginPaymentCheck();
    }
  } catch (_error) {
    // silent focus refresh
  }
});

const boot = async () => {
  render();

  const token = getToken();
  if (!token) {
    return;
  }

  try {
    await loadCurrentUser({ silent: true });
    const attempt = getPaymentAttempt();
    if (attempt && attempt.email === state.user?.email && state.subscription?.status !== 'subscribed') {
      beginPaymentCheck();
    }
  } catch (_error) {
    setToken('');
    setPaymentAttempt(null);
    render();
  }
};

boot();

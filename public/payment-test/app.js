const tokenStorageKey = 'evenit-payment-test-token';

const state = {
  stripe: null,
  elements: null,
  paymentIntentId: null,
  clientSecret: null
};

const elementsById = {
  tokenInput: document.getElementById('token-input'),
  logOutput: document.getElementById('log-output'),
  profileOutput: document.getElementById('profile-output'),
  intentOutput: document.getElementById('intent-output'),
  paymentElement: document.getElementById('payment-element'),
  payButton: document.getElementById('pay-button'),
  verifyButton: document.getElementById('verify-payment')
};

const setLog = (message, detail) => {
  const payload = detail ? `${message}\n\n${formatJson(detail)}` : message;
  elementsById.logOutput.textContent = payload;
};

const formatJson = (value) => JSON.stringify(value, null, 2);

const getToken = () => elementsById.tokenInput.value.trim();

const setToken = (token) => {
  elementsById.tokenInput.value = token;
  if (token) {
    localStorage.setItem(tokenStorageKey, token);
  } else {
    localStorage.removeItem(tokenStorageKey);
  }
};

const handleResponse = async (response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    const message = body.message || `Request failed with status ${response.status}`;
    throw new Error(message);
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

const setProfile = (profile) => {
  elementsById.profileOutput.textContent = profile
    ? formatJson(profile)
    : 'No profile loaded yet.';
};

const setIntent = (intent) => {
  elementsById.intentOutput.textContent = intent
    ? formatJson(intent)
    : 'No PaymentIntent created yet.';
};

const mountPaymentElement = async () => {
  if (!state.clientSecret || !state.stripe) {
    return;
  }

  if (state.elements) {
    state.elements = null;
    elementsById.paymentElement.innerHTML = '';
  }

  state.elements = state.stripe.elements({
    clientSecret: state.clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#be5b2d',
        colorText: '#1f2933',
        borderRadius: '14px'
      }
    }
  });

  const paymentElement = state.elements.create('payment');
  paymentElement.mount('#payment-element');
  elementsById.payButton.disabled = false;
};

const initializeStripe = async () => {
  const config = await apiRequest('/api/v1/public/stripe-config', { method: 'GET' });
  const publishableKey = config.data.publishableKey;

  if (!publishableKey) {
    setLog(
      'Stripe publishable key is missing. Set STRIPE_PUBLISHABLE_KEY in your .env before using the card form.',
      config.data
    );
    return;
  }

  state.stripe = Stripe(publishableKey);
};

const refreshProfile = async () => {
  try {
    const response = await apiRequest('/api/v1/auth/me', { method: 'GET' });
    setProfile(response.data);
    setLog('Loaded current profile.', response.data);
  } catch (error) {
    setProfile(null);
    setLog(error.message);
  }
};

const fillAuthForms = (email, password) => {
  document.querySelector('#register-form [name="email"]').value = email;
  document.querySelector('#verify-form [name="email"]').value = email;
  document.querySelector('#login-form [name="email"]').value = email;
  document.querySelector('#login-form [name="password"]').value = password;
};

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  try {
    const response = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    fillAuthForms(payload.email, payload.password);
    setLog(
      'Registration complete. If email delivery is not configured, read the OTP from the server terminal, then submit it below.',
      response
    );
  } catch (error) {
    setLog(error.message);
  }
});

document.getElementById('verify-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  try {
    const response = await apiRequest('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setToken(response.data.token);
    setProfile(response.data.user);
    setLog('Email verified and token saved.', response);
  } catch (error) {
    setLog(error.message);
  }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  try {
    const response = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setToken(response.data.token);
    setLog('Logged in and token saved.', response);
    await refreshProfile();
  } catch (error) {
    setLog(error.message);
  }
});

document.getElementById('save-token').addEventListener('click', () => {
  setToken(getToken());
  setLog('Token saved locally.');
});

document.getElementById('clear-token').addEventListener('click', () => {
  setToken('');
  setProfile(null);
  setIntent(null);
  setLog('Token cleared.');
});

document.getElementById('refresh-profile').addEventListener('click', refreshProfile);

document.getElementById('create-intent').addEventListener('click', async () => {
  try {
    const response = await apiRequest('/api/v1/subscriptions/payment-intent', {
      method: 'POST',
      body: JSON.stringify({})
    });

    state.clientSecret = response.data.clientSecret;
    state.paymentIntentId = response.data.paymentIntentId;
    setIntent(response.data);
    elementsById.verifyButton.disabled = true;
    await mountPaymentElement();
    setLog('PaymentIntent created. Enter the Stripe test card details and confirm the payment.', response.data);
  } catch (error) {
    setIntent(null);
    setLog(error.message);
  }
});

document.getElementById('payment-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.stripe || !state.elements || !state.clientSecret) {
    setLog('Create a PaymentIntent first.');
    return;
  }

  try {
    const submitResult = await state.elements.submit();
    if (submitResult.error) {
      throw new Error(submitResult.error.message || 'Payment details are incomplete');
    }

    const result = await state.stripe.confirmPayment({
      elements: state.elements,
      clientSecret: state.clientSecret,
      redirect: 'if_required'
    });

    if (result.error) {
      throw new Error(result.error.message || 'Stripe payment failed');
    }

    state.paymentIntentId = result.paymentIntent.id;
    elementsById.verifyButton.disabled = result.paymentIntent.status !== 'succeeded';
    setIntent(result.paymentIntent);
    setLog('Stripe confirmation completed.', result.paymentIntent);
  } catch (error) {
    setLog(error.message);
  }
});

document.getElementById('verify-payment').addEventListener('click', async () => {
  if (!state.paymentIntentId) {
    setLog('No PaymentIntent is available to verify.');
    return;
  }

  try {
    const response = await apiRequest('/api/v1/subscriptions/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId: state.paymentIntentId })
    });
    setLog('Backend verification completed and subscription updated.', response.data);
    await refreshProfile();
  } catch (error) {
    setLog(error.message);
  }
});

const boot = async () => {
  const savedToken = localStorage.getItem(tokenStorageKey) || '';
  if (savedToken) {
    setToken(savedToken);
  }

  try {
    await initializeStripe();
  } catch (error) {
    setLog(error.message);
  }

  if (savedToken) {
    await refreshProfile();
  }
};

void boot();

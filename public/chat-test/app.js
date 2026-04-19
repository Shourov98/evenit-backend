const storageKeys = {
  customerToken: 'evenit-chat-test-customer-token',
  providerToken: 'evenit-chat-test-provider-token',
  customerEmail: 'evenit-chat-test-customer-email',
  providerEmail: 'evenit-chat-test-provider-email'
};

const state = {
  services: [],
  serviceContext: null,
  selectedServiceId: '',
  selectedSlot: null,
  activeBookingId: '',
  activeConversationId: '',
  activeBookingSummary: null,
  customerBookings: [],
  providerBookings: [],
  sessions: {
    customer: {
      token: '',
      user: null
    },
    provider: {
      token: '',
      user: null
    }
  },
  messages: {
    customer: [],
    provider: []
  }
};

const elements = {
  logOutput: document.getElementById('log-output'),
  restoreButton: document.getElementById('restore-button'),
  refreshServicesButton: document.getElementById('refresh-services-button'),
  createBookingButton: document.getElementById('create-booking-button'),
  loadCustomerBookingsButton: document.getElementById('load-customer-bookings-button'),
  loadProviderBookingsButton: document.getElementById('load-provider-bookings-button'),
  refreshChatButton: document.getElementById('refresh-chat-button'),
  useBookingButton: document.getElementById('use-booking-button'),
  serviceSelect: document.getElementById('service-select'),
  serviceId: document.getElementById('service-id'),
  serviceOwnerId: document.getElementById('service-owner-id'),
  bookingSlot: document.getElementById('booking-slot'),
  contextStatus: document.getElementById('context-status'),
  providerMatchStatus: document.getElementById('provider-match-status'),
  bookingLocation: document.getElementById('booking-location'),
  bookingInstructions: document.getElementById('booking-instructions'),
  customerBookingsSelect: document.getElementById('customer-bookings-select'),
  providerBookingsSelect: document.getElementById('provider-bookings-select'),
  activeBookingId: document.getElementById('active-booking-id'),
  activeBookingStatus: document.getElementById('active-booking-status'),
  activeBookingTarget: document.getElementById('active-booking-target'),
  activeBookingCustomer: document.getElementById('active-booking-customer'),
  activeBookingProvider: document.getElementById('active-booking-provider'),
  customerMessages: document.getElementById('customer-messages'),
  providerMessages: document.getElementById('provider-messages'),
  customerChatMeta: document.getElementById('customer-chat-meta'),
  providerChatMeta: document.getElementById('provider-chat-meta'),
  customerMessageForm: document.getElementById('customer-message-form'),
  providerMessageForm: document.getElementById('provider-message-form'),
  customerMessageInput: document.getElementById('customer-message-input'),
  providerMessageInput: document.getElementById('provider-message-input'),
  customer: {
    form: document.getElementById('customer-login-form'),
    email: document.getElementById('customer-email'),
    password: document.getElementById('customer-password'),
    logoutButton: document.getElementById('customer-logout-button'),
    name: document.getElementById('customer-name'),
    role: document.getElementById('customer-role'),
    userId: document.getElementById('customer-user-id')
  },
  provider: {
    form: document.getElementById('provider-login-form'),
    email: document.getElementById('provider-email'),
    password: document.getElementById('provider-password'),
    logoutButton: document.getElementById('provider-logout-button'),
    name: document.getElementById('provider-name'),
    role: document.getElementById('provider-role'),
    userId: document.getElementById('provider-user-id')
  }
};

const formatJson = (value) => JSON.stringify(value, null, 2);

const setLog = (message, detail) => {
  elements.logOutput.textContent = detail ? `${message}\n\n${formatJson(detail)}` : message;
};

const setSessionToken = (roleKey, token) => {
  const storageKey = roleKey === 'customer' ? storageKeys.customerToken : storageKeys.providerToken;
  if (token) {
    localStorage.setItem(storageKey, token);
  } else {
    localStorage.removeItem(storageKey);
  }
};

const getSessionToken = (roleKey) => {
  const storageKey = roleKey === 'customer' ? storageKeys.customerToken : storageKeys.providerToken;
  return localStorage.getItem(storageKey) || '';
};

const setSavedEmail = (roleKey, email) => {
  const storageKey = roleKey === 'customer' ? storageKeys.customerEmail : storageKeys.providerEmail;
  if (email) {
    localStorage.setItem(storageKey, email);
  } else {
    localStorage.removeItem(storageKey);
  }
};

const getSavedEmail = (roleKey) => {
  const storageKey = roleKey === 'customer' ? storageKeys.customerEmail : storageKeys.providerEmail;
  return localStorage.getItem(storageKey) || '';
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

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

const getUserId = (user) => user?.id || user?.userId || '';

const apiRequest = async (path, options = {}) => {
  const headers = {
    ...(options.headers || {})
  };

  const response = await fetch(path, {
    ...options,
    headers
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }

  return body;
};

const authRequest = async (roleKey, path, options = {}) => {
  const token = state.sessions[roleKey].token;
  if (!token) {
    throw new Error(`Login required for ${roleKey}`);
  }

  return apiRequest(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
};

const renderSession = (roleKey) => {
  const session = state.sessions[roleKey];
  const section = elements[roleKey];

  section.name.textContent = session.user?.fullName || 'Not logged in';
  section.role.textContent = session.user?.role || '-';
  section.userId.textContent = getUserId(session.user) || '-';
};

const renderServiceSelect = () => {
  if (!state.services.length) {
    elements.serviceSelect.innerHTML = '<option value="">No published services found</option>';
    return;
  }

  elements.serviceSelect.innerHTML = state.services
    .map(
      (service) =>
        `<option value="${escapeHtml(service._id)}">${escapeHtml(
          `${service.information?.serviceName || 'Service'} | ${service.provider?.fullName || 'Unknown provider'}`
        )}</option>`
    )
    .join('');

  if (!state.selectedServiceId) {
    state.selectedServiceId = state.services[0]._id;
  }

  elements.serviceSelect.value = state.selectedServiceId;
};

const getSelectedService = () =>
  state.services.find((service) => service._id === state.selectedServiceId) || null;

const getAvailableHoursForDate = (isoDate, meta, availability) => {
  const entry = availability?.[isoDate] || {};
  const blocked = Array.isArray(entry.blockedHours) ? entry.blockedHours : [];
  const booked = Array.isArray(entry.bookedHours) ? entry.bookedHours : [];
  const unavailable = new Set([...blocked, ...booked]);
  const hours = [];

  for (let hour = meta.minHour; hour <= meta.maxHour; hour += 1) {
    if (!unavailable.has(hour)) {
      hours.push(hour);
    }
  }

  return hours;
};

const findFirstAvailableSlot = (context) => {
  if (!context?.bookingMeta) {
    return null;
  }

  const currentMonth = context.bookingMeta.currentMonth;
  const nextMonth = context.bookingMeta.nextMonth;
  const months = [currentMonth, nextMonth].filter(Boolean);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const monthKey of months) {
    const match = monthKey.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      continue;
    }

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(year, monthIndex, day);
      if (date < start) {
        continue;
      }

      const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hours = getAvailableHoursForDate(isoDate, context.bookingMeta, context.availability);
      if (hours.length > 0) {
        return {
          bookingDate: isoDate,
          hours: [hours[0]]
        };
      }
    }
  }

  return null;
};

const renderContext = () => {
  const service = getSelectedService();
  const ownerId = service?.provider?._id || '-';

  elements.serviceId.textContent = service?._id || '-';
  elements.serviceOwnerId.textContent = ownerId;
  elements.contextStatus.textContent = state.serviceContext
    ? 'Context loaded'
    : service
      ? 'Loading context...'
      : 'Waiting for service selection';

  if (state.selectedSlot) {
    elements.bookingSlot.textContent = `${state.selectedSlot.bookingDate} @ ${state.selectedSlot.hours.join(', ')}`;
  } else {
    elements.bookingSlot.textContent = 'No available slot found';
  }

  const providerUserId = getUserId(state.sessions.provider.user);
  if (!service || !providerUserId) {
    elements.providerMatchStatus.textContent =
      'Login both roles, then pick a service owned by the logged-in provider.';
    return;
  }

  elements.providerMatchStatus.textContent =
    providerUserId === service.provider?._id
      ? 'Provider matches the selected service owner.'
      : 'Logged-in provider does not own the selected service. Chat can still be tested with an existing booking, but new booking chat should use the matching provider.';
};

const formatBookingOption = (booking) => {
  const targetLabel = booking.targetType || 'booking';
  const hours = Array.isArray(booking.hours) && booking.hours.length ? booking.hours.join(',') : '-';
  return `${booking._id} | ${targetLabel} | ${booking.status || 'unknown'} | ${booking.bookingDate || '-'} | ${hours}`;
};

const renderBookings = (roleKey) => {
  const select = roleKey === 'customer' ? elements.customerBookingsSelect : elements.providerBookingsSelect;
  const bookings = roleKey === 'customer' ? state.customerBookings : state.providerBookings;

  if (!bookings.length) {
    select.innerHTML = '';
    return;
  }

  select.innerHTML = bookings
    .map((booking) => `<option value="${escapeHtml(booking._id)}">${escapeHtml(formatBookingOption(booking))}</option>`)
    .join('');
};

const renderBookingSummary = () => {
  const booking = state.activeBookingSummary;
  elements.activeBookingStatus.textContent = booking?.status || '-';
  elements.activeBookingTarget.textContent = booking
    ? `${booking.targetType || 'booking'} | ${booking.targetId || '-'}`
    : '-';
  elements.activeBookingCustomer.textContent = booking?.customer?.fullName || booking?.customerId || '-';
  elements.activeBookingProvider.textContent = booking?.provider?.fullName || booking?.providerId || '-';
};

const renderMessages = (roleKey) => {
  const container = roleKey === 'customer' ? elements.customerMessages : elements.providerMessages;
  const meta = roleKey === 'customer' ? elements.customerChatMeta : elements.providerChatMeta;
  const messages = state.messages[roleKey] || [];

  meta.textContent = state.activeBookingId
    ? `${messages.length} message${messages.length === 1 ? '' : 's'} loaded`
    : 'No booking loaded';

  if (!messages.length) {
    container.innerHTML = '<p class="message-empty">No messages loaded yet.</p>';
    return;
  }

  container.innerHTML = messages
    .map((message) => {
      const mineClass = message.isMine ? 'message mine' : 'message';
      return `
        <article class="${mineClass}">
          <div class="message-meta">
            <span>${escapeHtml(message.senderId)}</span>
            <span>${escapeHtml(formatDateTime(message.createdAt))}</span>
          </div>
          <div>${escapeHtml(message.content)}</div>
        </article>
      `;
    })
    .join('');
};

const loadCurrentUser = async (roleKey, { silent = false } = {}) => {
  const response = await authRequest(roleKey, '/api/v1/auth/me', { method: 'GET' });
  state.sessions[roleKey].user = response.data;
  renderSession(roleKey);
  renderContext();

  if (!silent) {
    setLog(`Loaded ${roleKey} session.`, response.data);
  }

  return response.data;
};

const restoreSessions = async () => {
  state.sessions.customer.token = getSessionToken('customer');
  state.sessions.provider.token = getSessionToken('provider');
  elements.customer.email.value = getSavedEmail('customer');
  elements.provider.email.value = getSavedEmail('provider');

  const tasks = [];
  if (state.sessions.customer.token) {
    tasks.push(
      loadCurrentUser('customer', { silent: true }).catch(() => {
        state.sessions.customer.token = '';
        state.sessions.customer.user = null;
        setSessionToken('customer', '');
        renderSession('customer');
      })
    );
  }

  if (state.sessions.provider.token) {
    tasks.push(
      loadCurrentUser('provider', { silent: true }).catch(() => {
        state.sessions.provider.token = '';
        state.sessions.provider.user = null;
        setSessionToken('provider', '');
        renderSession('provider');
      })
    );
  }

  await Promise.all(tasks);
};

const loginRole = async (roleKey) => {
  const section = elements[roleKey];
  const email = section.email.value.trim();
  const password = section.password.value;

  const response = await apiRequest('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  state.sessions[roleKey].token = response.data.token;
  state.sessions[roleKey].user = response.data.user;
  setSessionToken(roleKey, response.data.token);
  setSavedEmail(roleKey, email);
  renderSession(roleKey);
  renderContext();
  setLog(`Logged in as ${roleKey}.`, response.data.user);
};

const logoutRole = (roleKey) => {
  state.sessions[roleKey].token = '';
  state.sessions[roleKey].user = null;
  state.messages[roleKey] = [];
  setSessionToken(roleKey, '');
  renderSession(roleKey);
  renderMessages(roleKey);
  renderContext();
  setLog(`Logged out ${roleKey}.`);
};

const loadServices = async () => {
  const response = await apiRequest('/api/v1/public/services?limit=50&page=1&sortBy=createdAt&sortOrder=desc', {
    method: 'GET'
  });

  state.services = Array.isArray(response.data) ? response.data : response.data?.data || [];
  if (!state.selectedServiceId && state.services[0]?._id) {
    state.selectedServiceId = state.services[0]._id;
  }

  renderServiceSelect();
  await loadServiceContext();
  setLog('Loaded published services.', {
    total: state.services.length
  });
};

const loadServiceContext = async () => {
  const service = getSelectedService();
  if (!service?._id) {
    state.serviceContext = null;
    state.selectedSlot = null;
    renderContext();
    return;
  }

  elements.contextStatus.textContent = 'Loading context...';
  const response = await apiRequest(`/api/v1/bookings/services/${service._id}/context`, {
    method: 'GET'
  });

  state.serviceContext = response.data;
  state.selectedSlot = findFirstAvailableSlot(response.data);
  renderContext();
};

const createBooking = async () => {
  if (!state.sessions.customer.token) {
    throw new Error('Login as customer first');
  }

  const service = getSelectedService();
  if (!service?._id) {
    throw new Error('Select a published service first');
  }

  if (!state.selectedSlot) {
    throw new Error('No available booking slot found for the selected service');
  }

  const response = await authRequest('customer', `/api/v1/bookings/services/${service._id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bookingDate: state.selectedSlot.bookingDate,
      hours: state.selectedSlot.hours,
      location: elements.bookingLocation.value.trim(),
      specialInstructions: elements.bookingInstructions.value.trim()
    })
  });

  const booking = response.data;
  state.activeBookingId = booking._id;
  state.activeConversationId = booking.conversationId || '';
  elements.activeBookingId.value = booking._id;
  state.activeBookingSummary = booking;
  renderBookingSummary();

  await Promise.allSettled([loadBookings('customer'), loadBookings('provider')]);
  await loadChat();
  setLog('Created booking for chat testing.', booking);
};

const loadBookings = async (roleKey) => {
  const path = roleKey === 'customer' ? '/api/v1/bookings/my' : '/api/v1/bookings/provider';
  const response = await authRequest(roleKey, `${path}?limit=20&page=1&sortBy=createdAt&sortOrder=desc`, {
    method: 'GET'
  });

  if (roleKey === 'customer') {
    state.customerBookings = Array.isArray(response.data) ? response.data : [];
  } else {
    state.providerBookings = Array.isArray(response.data) ? response.data : [];
  }

  renderBookings(roleKey);
  setLog(`Loaded ${roleKey} bookings.`, {
    total: roleKey === 'customer' ? state.customerBookings.length : state.providerBookings.length
  });
};

const resolveActiveBookingSummary = () => {
  const bookingId = state.activeBookingId;
  const booking =
    state.customerBookings.find((item) => item._id === bookingId) ||
    state.providerBookings.find((item) => item._id === bookingId) ||
    null;

  if (booking) {
    state.activeBookingSummary = booking;
    state.activeConversationId = booking.conversationId || state.activeConversationId;
    renderBookingSummary();
  }
};

const resolveConversationId = async () => {
  if (state.activeConversationId) {
    return state.activeConversationId;
  }

  if (!state.activeBookingId) {
    throw new Error('Set an active booking first');
  }

  const resolverRole = state.sessions.customer.token
    ? 'customer'
    : state.sessions.provider.token
      ? 'provider'
      : '';

  if (!resolverRole) {
    throw new Error('Login as a booking participant first');
  }

  const response = await authRequest(
    resolverRole,
    `/api/v1/order-chats/bookings/${state.activeBookingId}/conversation`,
    { method: 'GET' }
  );

  state.activeConversationId = response.conversation?._id || '';
  if (!state.activeBookingSummary && response.booking) {
    state.activeBookingSummary = response.booking;
    renderBookingSummary();
  }

  if (!state.activeConversationId) {
    throw new Error('Conversation is not available for this booking yet');
  }

  return state.activeConversationId;
};

const loadMessagesForRole = async (roleKey) => {
  if (!state.activeBookingId) {
    state.messages[roleKey] = [];
    renderMessages(roleKey);
    return;
  }

  const conversationId = await resolveConversationId();

  const response = await authRequest(roleKey, `/api/v1/order-chats/conversations/${conversationId}/messages?limit=100&page=1`, {
    method: 'GET'
  });

  state.messages[roleKey] = Array.isArray(response.data) ? response.data : [];

  renderMessages(roleKey);
};

const loadChat = async () => {
  if (!state.activeBookingId) {
    throw new Error('Set an active booking first');
  }

  resolveActiveBookingSummary();

  await Promise.all(
    ['customer', 'provider']
      .filter((roleKey) => state.sessions[roleKey].token)
      .map((roleKey) => loadMessagesForRole(roleKey))
  );

  setLog('Loaded chat messages.', {
    bookingId: state.activeBookingId,
    conversationId: state.activeConversationId,
    customerMessages: state.messages.customer.length,
    providerMessages: state.messages.provider.length
  });
};

const sendMessage = async (roleKey, content) => {
  if (!state.activeBookingId) {
    throw new Error('Set an active booking first');
  }

  const conversationId = await resolveConversationId();

  const response = await authRequest(roleKey, `/api/v1/order-chats/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bookingId: state.activeBookingId,
      content
    })
  });

  await loadChat();
  setLog(`Sent chat message as ${roleKey}.`, response.data);
};

elements.customer.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await loginRole('customer');
  } catch (error) {
    setLog(error.message);
  }
});

elements.provider.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await loginRole('provider');
  } catch (error) {
    setLog(error.message);
  }
});

elements.customer.logoutButton.addEventListener('click', () => logoutRole('customer'));
elements.provider.logoutButton.addEventListener('click', () => logoutRole('provider'));

elements.restoreButton.addEventListener('click', async () => {
  try {
    await restoreSessions();
    setLog('Restored saved sessions.');
  } catch (error) {
    setLog(error.message);
  }
});

elements.refreshServicesButton.addEventListener('click', async () => {
  try {
    await loadServices();
  } catch (error) {
    setLog(error.message);
  }
});

elements.serviceSelect.addEventListener('change', async (event) => {
  state.selectedServiceId = event.target.value;
  try {
    await loadServiceContext();
    setLog('Loaded booking context for selected service.', {
      serviceId: state.selectedServiceId,
      slot: state.selectedSlot
    });
  } catch (error) {
    state.serviceContext = null;
    state.selectedSlot = null;
    renderContext();
    setLog(error.message);
  }
});

elements.createBookingButton.addEventListener('click', async () => {
  try {
    await createBooking();
  } catch (error) {
    setLog(error.message);
  }
});

elements.loadCustomerBookingsButton.addEventListener('click', async () => {
  try {
    await loadBookings('customer');
  } catch (error) {
    setLog(error.message);
  }
});

elements.loadProviderBookingsButton.addEventListener('click', async () => {
  try {
    await loadBookings('provider');
  } catch (error) {
    setLog(error.message);
  }
});

elements.customerBookingsSelect.addEventListener('change', async (event) => {
  state.activeBookingId = event.target.value;
  state.activeConversationId = '';
  elements.activeBookingId.value = state.activeBookingId;
  resolveActiveBookingSummary();
  try {
    await loadChat();
  } catch (error) {
    setLog(error.message);
  }
});

elements.providerBookingsSelect.addEventListener('change', async (event) => {
  state.activeBookingId = event.target.value;
  state.activeConversationId = '';
  elements.activeBookingId.value = state.activeBookingId;
  resolveActiveBookingSummary();
  try {
    await loadChat();
  } catch (error) {
    setLog(error.message);
  }
});

elements.useBookingButton.addEventListener('click', async () => {
  state.activeBookingId = elements.activeBookingId.value.trim();
  state.activeConversationId = '';
  resolveActiveBookingSummary();
  try {
    await loadChat();
  } catch (error) {
    setLog(error.message);
  }
});

elements.refreshChatButton.addEventListener('click', async () => {
  try {
    await loadChat();
  } catch (error) {
    setLog(error.message);
  }
});

elements.customerMessageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const content = elements.customerMessageInput.value.trim();
    if (!content) {
      throw new Error('Enter a customer message first');
    }
    await sendMessage('customer', content);
    elements.customerMessageInput.value = '';
  } catch (error) {
    setLog(error.message);
  }
});

elements.providerMessageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const content = elements.providerMessageInput.value.trim();
    if (!content) {
      throw new Error('Enter a provider message first');
    }
    await sendMessage('provider', content);
    elements.providerMessageInput.value = '';
  } catch (error) {
    setLog(error.message);
  }
});

const init = async () => {
  renderSession('customer');
  renderSession('provider');
  renderMessages('customer');
  renderMessages('provider');
  renderBookingSummary();
  elements.customer.email.value = getSavedEmail('customer');
  elements.provider.email.value = getSavedEmail('provider');

  try {
    await restoreSessions();
    await loadServices();
  } catch (error) {
    setLog(error.message);
  }
};

init();

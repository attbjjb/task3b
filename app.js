// ---------- Ссылки на DOM-элементы ----------
const loadBtn = document.getElementById('loadBtn');
const searchInput = document.getElementById('searchInput');
const usersList = document.getElementById('usersList');
const postsArea = document.getElementById('postsArea');
const statusEl = document.getElementById('status');

const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

// ---------- Состояние ----------
let allUsers = [];      // полный загруженный список (для фильтрации)
let usersLoaded = false; // флаг: были ли данные загружены

// ---------- Утилиты ----------
function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = 'status' + (type ? ` status--${type}` : '');
}

function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

// ---------- Загрузка пользователей (GET /users) ----------
async function loadUsers() {
  loadBtn.disabled = true;
  setStatus('Загрузка...', 'loading');
  usersList.replaceChildren();
  postsArea.replaceChildren();
  clearPostsAreaHint();

  try {
    const response = await fetch(USERS_URL);

    // Проверяем HTTP-статус (404, 500 и т.д.)
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
    }

    const users = await response.json();

    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('Сервер вернул пустой список пользователей.');
    }

    allUsers = users;
    usersLoaded = true;

    renderUsers(allUsers);
    setStatus(`Загружено пользователей: ${users.length}`, 'success');
  } catch (error) {
    // Сюда попадают и HTTP-ошибки (response.ok === false),
    // и сетевые сбои (fetch reject), и ошибки парсинга JSON.
    setStatus(`Не удалось загрузить пользователей: ${error.message}. Попробуйте ещё раз.`, 'error');
    console.error('loadUsers error:', error);
  } finally {
    // Кнопка всегда снова активна — можно повторить попытку
    loadBtn.disabled = false;
  }
}

// ---------- Отрисовка списка пользователей ----------
function renderUsers(users) {
  clearElement(usersList);

  if (!users.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = 'Пользователи не найдены';
    usersList.appendChild(empty);
    return;
  }

  users.forEach((user) => {
    usersList.appendChild(createUserCard(user));
  });
}

function createUserCard(user) {
  const card = document.createElement('article');
  card.className = 'user-card';

  const name = document.createElement('h3');
  name.textContent = user.name;

  const email = document.createElement('p');
  email.className = 'meta';
  email.textContent = `Email: ${user.email}`;

  const city = document.createElement('p');
  city.className = 'meta';
  // Город лежит в user.address.city
  const cityName = user.address && user.address.city ? user.address.city : 'не указан';
  city.textContent = `Город: ${cityName}`;

  const postsBtn = document.createElement('button');
  postsBtn.type = 'button';
  postsBtn.textContent = 'Показать публикации';
  postsBtn.addEventListener('click', () => loadPosts(user, postsBtn));

  card.append(name, email, city, postsBtn);
  return card;
}

// ---------- Публикации пользователя (GET /posts?userId=ID) ----------
async function loadPosts(user, triggerBtn) {
  const originalText = triggerBtn.textContent;
  triggerBtn.disabled = true;
  triggerBtn.textContent = 'Загрузка...';
  setStatus('Загрузка...', 'loading');

  clearElement(postsArea);

  try {
    const response = await fetch(`${POSTS_URL}?userId=${user.id}`);

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
    }

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error(`У пользователя ${user.name} нет публикаций.`);
    }

    const firstThree = posts.slice(0, 3);
    renderPosts(user, firstThree);
    setStatus(`Загружены публикации пользователя: ${user.name}`, 'success');
  } catch (error) {
    setStatus(`Не удалось загрузить публикации: ${error.message}. Попробуйте ещё раз.`, 'error');
    console.error('loadPosts error:', error);
  } finally {
    triggerBtn.disabled = false;
    triggerBtn.textContent = originalText;
  }
}

function renderPosts(user, posts) {
  clearElement(postsArea);

  const heading = document.createElement('h3');
  heading.textContent = `Публикации пользователя: ${user.name}`;
  postsArea.appendChild(heading);

  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'post-card';

    const title = document.createElement('h3');
    title.textContent = post.title;

    const body = document.createElement('p');
    body.textContent = post.body;

    card.append(title, body);
    postsArea.appendChild(card);
  });
}

function clearPostsAreaHint() {
  // Возвращаем подсказку-заглушку в область публикаций
  clearElement(postsArea);
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Выберите пользователя и нажмите «Показать публикации».';
  postsArea.appendChild(hint);
}

// ---------- Поиск по имени (без HTTP-запроса) ----------
function handleSearch() {
  if (!usersLoaded) {
    // Пока данные не загружены — фильтровать нечего
    return;
  }

  const query = searchInput.value.trim().toLowerCase();

  const filtered = query
    ? allUsers.filter((u) => u.name.toLowerCase().includes(query))
    : allUsers;

  renderUsers(filtered);

  if (query && filtered.length === 0) {
    setStatus('Пользователи не найдены', 'error');
  } else if (query) {
    setStatus(`Найдено: ${filtered.length}`, 'success');
  } else {
    setStatus(`Загружено пользователей: ${allUsers.length}`, 'success');
  }
}

// ---------- Подписки на события ----------
loadBtn.addEventListener('click', loadUsers);
searchInput.addEventListener('input', handleSearch);
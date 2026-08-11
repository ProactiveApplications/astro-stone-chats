const COOKIE_NAME = '__wps';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function getToken(password, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((part) => {
    const [key, ...val] = part.trim().split('=');
    out[key.trim()] = val.join('=').trim();
  });
  return out;
}

function loginPage(error = '') {
  const errorHtml = error
    ? `<p class="error">${error}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome Pack — Stonechats</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Raleway:wght@600;700&family=Lato:ital,wght@0,400;0,500;1,400&display=swap" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      background: #ebf2f4;
      font-family: 'Lato', system-ui, sans-serif;
      color: #7f636e;
    }

    main {
      min-height: 100vh;
      padding-top: 5.5rem;
      padding-bottom: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-inline: 1rem;
    }
    @media (min-width: 768px) {
      main { padding-top: max(4.5rem, 20vh); }
    }

    /* Navbar */
    .stonechats-navbar {
      background: #eaf2f3 !important;
      border-bottom: 1px solid rgba(127, 99, 110, 0.15);
    }
    .stonechats-navbar .navbar-brand {
      font-family: 'Raleway', system-ui, sans-serif;
      font-weight: 700;
      font-size: 1.65rem;
      color: #c24418 !important;
      letter-spacing: 0.005em;
    }
    .stonechats-navbar .nav-link {
      color: #c24418 !important;
      font-family: 'Lato', system-ui, sans-serif;
      font-weight: 500;
      padding: 0.5rem 1rem !important;
      opacity: 0.9;
      transition: opacity 0.2s ease;
    }
    .stonechats-navbar .nav-link:hover { opacity: 1; }
    .stonechats-navbar .nav-link.active {
      opacity: 1;
      font-weight: 600;
      border-bottom: 2px solid #c24418;
    }
    .stonechats-navbar .navbar-toggler {
      border-color: rgba(194, 68, 24, 0.35);
      padding: 0.35rem 0.6rem;
    }
    .stonechats-navbar .navbar-toggler:focus { box-shadow: none; }
    .stonechats-navbar .navbar-toggler-icon {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='%23c24418' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
    }

    /* Login card */
    .login-card {
      background: #fff;
      border: 1px solid rgba(166, 185, 191, 0.4);
      border-radius: 0.75rem;
      padding: 2.25rem 2rem;
      width: 100%;
      max-width: 400px;
      text-align: center;
    }
    .card-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: #c24418;
      color: #fff;
      font-size: 1.4rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-family: 'Raleway', system-ui, sans-serif;
      font-weight: 600;
      font-size: 1.5rem;
      color: #7f636e;
      margin: 0 0 0.5rem;
    }
    .subtitle {
      font-size: 0.95rem;
      opacity: 0.8;
      margin: 0 0 1.75rem;
    }
    label {
      display: block;
      font-weight: 500;
      font-size: 0.9rem;
      text-align: left;
      margin-bottom: 0.4rem;
    }
    input[type="password"] {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1px solid rgba(166, 185, 191, 0.7);
      border-radius: 0.5rem;
      font-family: 'Lato', system-ui, sans-serif;
      font-size: 1rem;
      color: #7f636e;
      background: #fff;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus { border-color: #a6b9bf; }
    .error {
      color: #c24418;
      font-size: 0.9rem;
      margin: 0.75rem 0 0;
      text-align: left;
    }
    button[type="submit"] {
      width: 100%;
      margin-top: 1.25rem;
      padding: 0.85rem 2rem;
      background: #c24418;
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      font-family: 'Lato', system-ui, sans-serif;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button[type="submit"]:hover { background: #7f636e; }
  </style>
</head>
<body>
  <nav class="navbar navbar-expand-lg fixed-top stonechats-navbar" aria-label="Main navigation">
    <div class="container">
      <a class="navbar-brand" href="/">Stonechats</a>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavCollapse"
        aria-controls="mainNavCollapse"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse justify-content-end" id="mainNavCollapse">
        <ul class="navbar-nav gap-lg-2">
          <li class="nav-item">
            <a class="nav-link" href="/">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link active" href="/welcome-pack" aria-current="page">Welcome Pack</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <main>
    <div class="login-card">
      <span class="card-icon"><i class="bi bi-lock" aria-hidden="true"></i></span>
      <h1>Welcome Pack</h1>
      <p class="subtitle">Please enter the password provided by your host.</p>
      <form method="POST" action="/welcome-pack">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          autocomplete="current-password"
          autofocus
          required
        />
        ${errorHtml}
        <button type="submit">Continue</button>
      </form>
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Only guard the welcome-pack path
  if (!url.pathname.startsWith('/welcome-pack')) {
    return next();
  }

  const password = env.WELCOME_PACK_PASSWORD;
  const secret = env.COOKIE_SECRET;
  if (!password || !secret) {
    // Both env vars required — pass through if misconfigured rather than silently locking everyone out
    return next();
  }

  const expectedToken = await getToken(password, secret);
  const cookies = parseCookies(request.headers.get('Cookie'));

  // Valid session — serve the page
  if (cookies[COOKIE_NAME] === expectedToken) {
    return next();
  }

  // Handle password form submission
  if (request.method === 'POST') {
    let submitted = '';
    try {
      const body = await request.formData();
      submitted = body.get('password') ?? '';
    } catch {
      // malformed body — show form again
    }

    if (submitted === password) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/welcome-pack',
          'Set-Cookie': `${COOKIE_NAME}=${expectedToken}; Path=/welcome-pack; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
        },
      });
    }

    return new Response(loginPage('Incorrect password — please try again.'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Show login form
  return new Response(loginPage(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

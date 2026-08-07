const COOKIE_NAME = '__wps';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Raleway:wght@600;700&family=Lato:wght@400;500&display=swap" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #ebf2f4;
      font-family: 'Lato', system-ui, sans-serif;
      color: #7f636e;
      padding: 2rem 1rem;
    }
    .brand {
      font-family: 'Raleway', system-ui, sans-serif;
      font-weight: 700;
      font-size: 2rem;
      color: #c24418;
      margin-bottom: 2rem;
      letter-spacing: 0.005em;
    }
    .card {
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
  <div class="brand">Stonechats</div>
  <div class="card">
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

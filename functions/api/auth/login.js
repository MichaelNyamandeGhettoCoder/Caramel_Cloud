export async function onRequestPost({ request, env }) {
  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ error: 'Password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the input password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Get user from D1
    const { results } = await env.DB.prepare('SELECT * FROM users WHERE id = 1').all();

    if (!results.length) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = results[0];

    // Check password
    if (inputHash!== user.password_hash) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If default password, tell frontend to show setup
    if (user.is_default_password === 1) {
      return new Response(JSON.stringify({
        success: false,
        requireSetup: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Normal login success - set cookie
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth=${token}; Path=/; Expires=${expiry.toUTCString()}; HttpOnly; Secure; SameSite=Strict`
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

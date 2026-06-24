export async function onRequestPost(context) {
  const { request, env } = context;
  const { userId, currentPassword, newPassword, newEmail } = await request.json();

  if (!newEmail || !newPassword) {
    return Response.json({ success: false, error: 'Email and password required' }, { status: 400 });
  }

  // Strong password check: 8+ chars, upper, lower, number, special
  const strong = newPassword.length >= 8 &&
                 /[A-Z]/.test(newPassword) &&
                 /[a-z]/.test(newPassword) &&
                 /[0-9]/.test(newPassword) &&
                 /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  
  if (!strong) {
    return Response.json({ 
      success: false, 
      error: 'Password must be 8+ chars with uppercase, lowercase, number, and special character' 
    }, { status: 400 });
  }

  const hash = async (p) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const currentHash = await hash(currentPassword);
  const newHash = await hash(newPassword);

  const { success } = await env.DB.prepare(
    "UPDATE users SET email =?, password_hash =?, is_default_password = 0 WHERE id =? AND password_hash =?"
  ).bind(newEmail, newHash, userId, currentHash).run();

  return Response.json({ success });
}

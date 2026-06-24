export async function onRequestPost(context) {
  const { request, env } = context;
  const { password } = await request.json();

  const hash = async (p) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const inputHash = await hash(password);
  const user = await env.DB.prepare(
    "SELECT id, email, is_default_password FROM users WHERE password_hash =?"
  ).bind(inputHash).first();

  if (!user) {
    return Response.json({ success: false, error: 'Wrong password' }, { status: 401 });
  }

  return Response.json({
    success: true,
    mustSetup: user.is_default_password === 1,
    userId: user.id
  });
}

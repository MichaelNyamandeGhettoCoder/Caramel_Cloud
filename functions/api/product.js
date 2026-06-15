export async function onRequestGet({ env }) {
  try {
    const products = await env.USERS.get('products', { type: 'json' });
    return new Response(JSON.stringify(products || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const product = await request.json();
    const products = await env.USERS.get('products', { type: 'json' }) || [];
    products.unshift(product);
    await env.USERS.put('products', JSON.stringify(products));
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const updated = await request.json();
    const products = await env.USERS.get('products', { type: 'json' }) || [];
    const idx = products.findIndex(p => p.id === updated.id);
    if (idx!== -1) products[idx] = updated;
    await env.USERS.put('products', JSON.stringify(products));
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const { id } = await request.json();
    let products = await env.USERS.get('products', { type: 'json' }) || [];
    products = products.filter(p => p.id!== id);
    await env.USERS.put('products', JSON.stringify(products));
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

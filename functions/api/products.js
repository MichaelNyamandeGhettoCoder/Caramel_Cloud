export async function onRequest(context) {
  const { request, env } = context;
  const KV = env.PRODUCTS_KV; // You'll bind this in Cloudflare dashboard

  if (request.method === 'GET') {
    const productsJson = await KV.get('products');
    const products = productsJson ? JSON.parse(productsJson) : [];
    return new Response(JSON.stringify(products), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    const newProduct = await request.json();
    const productsJson = await KV.get('products');
    const products = productsJson ? JSON.parse(productsJson) : [];
    
    newProduct.id = newProduct.id || Date.now().toString();
    products.unshift(newProduct);
    await KV.put('products', JSON.stringify(products));
    
    return new Response(JSON.stringify(newProduct), {
      headers: { 'Content-Type': 'application/json' },
      status: 201
    });
  }

  if (request.method === 'DELETE') {
    const { id } = await request.json();
    const productsJson = await KV.get('products');
    let products = productsJson ? JSON.parse(productsJson) : [];
    products = products.filter(p => p.id !== id);
    await KV.put('products', JSON.stringify(products));
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response('Method not allowed', { status: 405 });
}

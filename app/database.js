export async function executeQuery(query, values) {
  try {
    const response = await fetch('https://apitc-production.up.railway.app/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, values }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Database query failed:', error);
    return null;
  }
}

// ✅ Add a default export
export default { executeQuery };

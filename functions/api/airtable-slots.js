const REQUIRED_ENV_KEYS = ['AIRTABLE_TOKEN', 'AIRTABLE_BASE'];

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function validateEnv(env) {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !String(env[key] || '').trim());
  const tableRef = String(env.AIRTABLE_TABLE_ID || env.AIRTABLE_TABLE || '').trim();

  if (!tableRef) {
    missing.push('AIRTABLE_TABLE or AIRTABLE_TABLE_ID');
  }

  return { missing, tableRef };
}

export async function onRequest(context) {
  const { env } = context;

  const { missing, tableRef } = validateEnv(env);
  if (missing.length > 0) {
    return jsonResponse(500, {
      error: `Missing environment variables: ${missing.join(', ')}`
    });
  }

  const token = String(env.AIRTABLE_TOKEN || '').trim();
  const base = String(env.AIRTABLE_BASE || '').trim();

  const url =
    `https://api.airtable.com/v0/${base}/${encodeURIComponent(tableRef)}` +
    '?sort[0][field]=Datum&sort[0][direction]=asc';

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      return jsonResponse(res.status, {
        error: `Airtable API error: ${res.status} ${res.statusText}`,
        details: errorText
      });
    }

    const data = await res.json();
    return jsonResponse(200, {
      records: data.records || []
    });
  } catch (error) {
    return jsonResponse(500, {
      error: 'Unexpected error while loading Airtable records.',
      details: String(error?.message ?? error)
    });
  }
}
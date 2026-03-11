const INDEXNOW_KEY = '7821142901764bd4891905591fd65eb1';
const HOST = 'americanimpactreview.com';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

export async function notifyIndexNow(urls: string | string[]) {
  const urlList = Array.isArray(urls) ? urls : [urls];

  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList.map((u) =>
      u.startsWith('http') ? u : `https://${HOST}${u}`
    ),
  };

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  return { status: res.status, ok: res.ok };
}

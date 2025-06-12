import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ message: 'Domain is required' });
  }

  const extensions = ['.com', '.net', '.org', '.co', '.co.in', '.in', '.us', '.info', '.biz', '.me'];
  const results = [];

  for (const ext of extensions) {
    const fullDomain = domain + ext;
    
    try {
      await lookup(fullDomain);
      results.push({ domain: fullDomain, available: false });
    } catch (error) {
      // Domain likely available if DNS lookup fails
      results.push({ domain: fullDomain, available: true });
    }
  }

  res.status(200).json({ results });
}

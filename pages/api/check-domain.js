import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domains } = req.body;

  if (!domains || !Array.isArray(domains)) {
    return res.status(400).json({ message: 'Domains array is required' });
  }

  const extensions = ['.com', '.net', '.org', '.co', '.info', '.biz', '.me', '.io', '.ai', '.tech', '.online', '.site', '.website', '.store', '.app', '.dev'];
  const results = [];

  // Process each domain
  for (const baseDomain of domains) {
    if (!baseDomain.trim()) continue;
    
    const domainResults = [];
    
    // Check each extension for this domain
    for (const ext of extensions) {
      const fullDomain = baseDomain.trim() + ext;
      
      try {
        await lookup(fullDomain);
        domainResults.push({ 
          domain: fullDomain, 
          available: false,
          status: 'taken'
        });
      } catch (error) {
        domainResults.push({ 
          domain: fullDomain, 
          available: true,
          status: 'available'
        });
      }
    }
    
    results.push({
      baseDomain: baseDomain.trim(),
      extensions: domainResults
    });
  }

  res.status(200).json({ results });
}

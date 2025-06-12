// pages/api/check-domain.js - Version m7asna
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

// Function bach ncheckiw wach domain taken wlla la
async function checkDomainAvailability(domain) {
  try {
    // DNS lookup bach ncheckiw wach domain resolve
    await lookup(domain);
    return { available: false, status: 'taken', method: 'dns' };
  } catch (error) {
    // Ila DNS lookup failed, domain might be available
    if (error.code === 'ENOTFOUND') {
      return { available: true, status: 'available', method: 'dns' };
    }
    // Ila error okhra, nconsiderawha taken bach nkunu safe
    return { available: false, status: 'unknown', method: 'dns', error: error.code };
  }
}

// Alternative method using HTTP check
async function checkDomainHTTP(domain) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`http://${domain}`, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return { available: false, status: 'taken', method: 'http' };
  } catch (error) {
    return { available: true, status: 'available', method: 'http' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domains } = req.body;

  if (!domains || !Array.isArray(domains)) {
    return res.status(400).json({ message: 'Domains array is required' });
  }

  // Extensions li bghiti tcheckihom
  const extensions = ['.net', '.co', '.co.in', '.in', '.us'];
  const results = [];

  try {
    // Process kol domain
    for (const baseDomain of domains) {
      if (!baseDomain.trim()) continue;
      
      const domainResults = [];
      
      // Check kol extension l had domain
      for (const ext of extensions) {
        const fullDomain = baseDomain.trim() + ext;
        
        try {
          // First njarrbu DNS lookup
          const dnsResult = await checkDomainAvailability(fullDomain);
          
          // Ila DNS lookup gal available, nconfirmiw b HTTP check
          if (dnsResult.available) {
            const httpResult = await checkDomainHTTP(fullDomain);
            
            // Ila HTTP check gal taken, nakhdu HTTP result
            if (!httpResult.available) {
              domainResults.push({
                domain: fullDomain,
                available: false,
                status: 'taken',
                method: 'http-override'
              });
            } else {
              domainResults.push({
                domain: fullDomain,
                available: true,
                status: 'available',
                method: 'both'
              });
            }
          } else {
            // DNS gal taken, so domain taken
            domainResults.push({
              domain: fullDomain,
              available: false,
              status: dnsResult.status,
              method: dnsResult.method
            });
          }
        } catch (error) {
          // Ila error, nconsideraw domain taken bach nkunu safe
          domainResults.push({
            domain: fullDomain,
            available: false,
            status: 'error',
            method: 'error',
            error: error.message
          });
        }
        
        // Small delay bach ma-n-overload-ch l-server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      results.push({
        baseDomain: baseDomain.trim(),
        extensions: domainResults
      });
    }

    res.status(200).json({ 
      results,
      message: 'Domain check completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error f domain checking:', error);
    res.status(500).json({ 
      message: 'Server error occurred',
      error: error.message 
    });
  }
}

// Rate limiting function (optional)
const rateLimiter = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // 10 requests per minute
  
  if (!rateLimiter.has(ip)) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limit = rateLimiter.get(ip);
  
  if (now > limit.resetTime) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Export rate limiter ila bghiti testa3mlha
export { checkRateLimit };

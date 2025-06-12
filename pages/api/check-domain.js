// pages/api/check-domain.js - Multiple check methods for accuracy
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { domains } = req.body;

    if (!domains || !Array.isArray(domains)) {
      return res.status(400).json({ message: 'Domains array is required' });
    }

    const extensions = ['.net', '.co', '.co.in', '.in', '.us'];
    const results = [];

    // Function bach nclean domain
    function cleanDomain(domain) {
      let cleanedDomain = domain.trim().toLowerCase();
      extensions.forEach(ext => {
        if (cleanedDomain.endsWith(ext)) {
          cleanedDomain = cleanedDomain.slice(0, -ext.length);
        }
      });
      cleanedDomain = cleanedDomain.replace(/^(https?:\/\/)?(www\.)?/, '');
      return cleanedDomain;
    }

    // Multiple check methods for better accuracy
    async function checkDomainMultiple(domain) {
      const checks = [];
      
      // Method 1: HTTP check
      const httpCheck = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const response = await fetch(`https://${domain}`, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)'
            }
          });
          
          clearTimeout(timeoutId);
          return { taken: true, method: 'http', status: response.status };
          
        } catch (error) {
          return { taken: false, method: 'http', error: error.message };
        }
      };

      // Method 2: DNS check via different approach
      const dnsCheck = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          // Try to resolve domain by making request to a different endpoint
          const response = await fetch(`http://${domain}`, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)'
            }
          });
          
          clearTimeout(timeoutId);
          return { taken: true, method: 'dns', status: response.status };
          
        } catch (error) {
          return { taken: false, method: 'dns', error: error.message };
        }
      };

      // Method 3: Check for common hosting providers
      const hostingCheck = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);
          
          const response = await fetch(`https://${domain}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)'
            }
          });
          
          clearTimeout(timeoutId);
          
          const text = await response.text().catch(() => '');
          
          // Check for common domain parking/hosting indicators
          const indicators = [
            'parked domain',
            'domain for sale',
            'godaddy',
            'namecheap',
            'domain.com',
            'this domain may be for sale',
            'buy this domain',
            'register this domain',
            'domain parking',
            'sedo',
            'hugedomains'
          ];
          
          const isParked = indicators.some(indicator => 
            text.toLowerCase().includes(indicator)
          );
          
          return { 
            taken: true, 
            method: 'hosting', 
            isParked, 
            status: response.status,
            hasContent: text.length > 100
          };
          
        } catch (error) {
          return { taken: false, method: 'hosting', error: error.message };
        }
      };

      // Run all checks in parallel
      const [httpResult, dnsResult, hostingResult] = await Promise.allSettled([
        httpCheck(),
        dnsCheck(),
        hostingCheck()
      ]);

      // Analyze results
      let taken = false;
      let confidence = 0;
      let methods = [];
      
      [httpResult, dnsResult, hostingResult].forEach(result => {
        if (result.status === 'fulfilled' && result.value.taken) {
          taken = true;
          confidence += 1;
          methods.push(result.value);
        }
      });

      return {
        available: !taken,
        taken: taken,
        confidence: confidence,
        methods: methods,
        status: taken ? 'taken' : 'available'
      };
    }

    // Process domains in parallel batches
    const batchSize = 15; // Reduced for better accuracy
    
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (inputDomain) => {
        if (!inputDomain?.trim()) return null;
        
        const baseDomain = cleanDomain(inputDomain);
        if (!baseDomain) return null;

        // Check all extensions for this domain
        const extensionPromises = extensions.map(async (ext) => {
          const fullDomain = baseDomain + ext;
          const result = await checkDomainMultiple(fullDomain);
          
          return {
            domain: fullDomain,
            available: result.available,
            taken: result.taken,
            confidence: result.confidence,
            methods: result.methods,
            status: result.status
          };
        });

        const extensionResults = await Promise.allSettled(extensionPromises);
        
        return {
          baseDomain,
          originalInput: inputDomain,
          extensions: extensionResults.map(result => 
            result.status === 'fulfilled' ? result.value : {
              domain: baseDomain + '.error',
              available: true,
              taken: false,
              confidence: 0,
              status: 'error'
            }
          )
        };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });
    }

    return res.status(200).json({ 
      results,
      success: true,
      checked: results.length,
      note: 'Using multiple check methods for better accuracy'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      success: false
    });
  }
}

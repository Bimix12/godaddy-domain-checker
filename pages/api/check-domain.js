// pages/api/check-domain.js - Version fixed bach ma idoblch extensions
export default async function handler(req, res) {
  // Check method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { domains } = req.body;

    // Validate input
    if (!domains || !Array.isArray(domains)) {
      return res.status(400).json({ message: 'Domains array is required' });
    }

    // Extensions li bghina ncheckiwhom
    const extensions = ['.net', '.co', '.co.in', '.in', '.us'];
    const results = [];

    // Function bach nclean domain men ay extension
    function cleanDomain(domain) {
      let cleanedDomain = domain.trim().toLowerCase();
      
      // Remove any existing extensions
      extensions.forEach(ext => {
        // Remove extension if it's at the end
        if (cleanedDomain.endsWith(ext)) {
          cleanedDomain = cleanedDomain.slice(0, -ext.length);
        }
      });
      
      // Remove www. if exists
      if (cleanedDomain.startsWith('www.')) {
        cleanedDomain = cleanedDomain.slice(4);
      }
      
      // Remove http:// or https://
      cleanedDomain = cleanedDomain.replace(/^https?:\/\//, '');
      
      return cleanedDomain;
    }

    // Function basita bach ncheck domain using multiple methods
    async function checkSingleDomain(domain) {
      // Method 1: Check with HTTP request
      let httpCheck = { available: true, method: 'http' };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced timeout
        
        const response = await fetch(`https://${domain}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)'
          }
        });
        
        clearTimeout(timeoutId);
        
        // Ila response jat o status code mzyan, domain taken
        if (response.status >= 200 && response.status < 400) {
          httpCheck = { available: false, method: 'http', status: response.status };
        }
        
      } catch (error) {
        // HTTP failed, might be available
        httpCheck = { available: true, method: 'http', error: error.name };
      }

      // Method 2: Try HTTPS with www
      let wwwCheck = { available: true, method: 'www' };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`https://www.${domain}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.status >= 200 && response.status < 400) {
          wwwCheck = { available: false, method: 'www', status: response.status };
        }
        
      } catch (error) {
        wwwCheck = { available: true, method: 'www', error: error.name };
      }

      // Method 3: Try HTTP (not HTTPS)
      let httpPlainCheck = { available: true, method: 'http-plain' };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`http://${domain}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.status >= 200 && response.status < 400) {
          httpPlainCheck = { available: false, method: 'http-plain', status: response.status };
        }
        
      } catch (error) {
        httpPlainCheck = { available: true, method: 'http-plain', error: error.name };
      }

      // Decision logic: Ila chi method galt domain taken, consideriha taken
      const isTaken = !httpCheck.available || !wwwCheck.available || !httpPlainCheck.available;
      
      return { 
        available: !isTaken, 
        status: isTaken ? 'taken' : 'available',
        checks: {
          https: httpCheck,
          www: wwwCheck,
          http: httpPlainCheck
        }
      };
    }

    // Process kol domain
    for (let i = 0; i < domains.length; i++) {
      const inputDomain = domains[i];
      
      if (!inputDomain || !inputDomain.trim()) {
        continue;
      }

      // Clean domain men ay extension li dayez
      const baseDomain = cleanDomain(inputDomain);
      
      // Skip empty domains after cleaning
      if (!baseDomain) {
        continue;
      }

      const domainResults = [];

      // Check kol extension
      for (let j = 0; j < extensions.length; j++) {
        const ext = extensions[j];
        const fullDomain = baseDomain + ext;
        
        try {
          const result = await checkSingleDomain(fullDomain);
          
          domainResults.push({
            domain: fullDomain,
            available: result.available,
            status: result.status
          });
          
          // Small delay bach ma-noverload-ch (reduced delay)
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          // Ila error, nconsideraw domain taken
          domainResults.push({
            domain: fullDomain,
            available: false,
            status: 'error'
          });
        }
      }

      results.push({
        baseDomain: baseDomain,
        originalInput: inputDomain,
        extensions: domainResults
      });
    }

    // Return results
    return res.status(200).json({ 
      results,
      success: true,
      checked: results.length
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

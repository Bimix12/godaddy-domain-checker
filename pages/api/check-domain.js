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

    // Function basita bach ncheck domain
    async function checkSingleDomain(domain) {
      try {
        // Njarrbu n-fetch l'domain
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`https://${domain}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DomainChecker/1.0)'
          }
        });
        
        clearTimeout(timeoutId);
        
        // Ila response jat, domain taken
        return { available: false, status: 'taken' };
        
      } catch (error) {
        // Ila error jat, domain available (probably)
        return { available: true, status: 'available' };
      }
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
          
          // Small delay bach ma-noverload-ch
          await new Promise(resolve => setTimeout(resolve, 150));
          
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

// pages/api/check-domain.js - Ultra fast version
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

    // Fast domain check - parallel processing
    async function checkDomainFast(domain) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // Reduced timeout
        
        const response = await fetch(`https://${domain}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FastChecker/1.0)'
          }
        });
        
        clearTimeout(timeoutId);
        return { available: false, status: 'taken' };
        
      } catch (error) {
        return { available: true, status: 'available' };
      }
    }

    // Process all domains in parallel batches
    const batchSize = 20; // Increased batch size
    
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      
      // Process each domain in the batch
      const batchPromises = batch.map(async (inputDomain) => {
        if (!inputDomain?.trim()) return null;
        
        const baseDomain = cleanDomain(inputDomain);
        if (!baseDomain) return null;

        // Check all extensions for this domain in parallel
        const extensionPromises = extensions.map(async (ext) => {
          const fullDomain = baseDomain + ext;
          const result = await checkDomainFast(fullDomain);
          return {
            domain: fullDomain,
            available: result.available,
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
              status: 'error'
            }
          )
        };
      });

      // Wait for the batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Add successful results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });

      // No delay between batches for maximum speed
    }

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

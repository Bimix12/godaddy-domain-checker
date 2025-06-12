// pages/api/check-domain.js - Real Domain Availability Checker
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

    // Your RapidAPI key
    const RAPIDAPI_KEY = "dLYuzkosMXb5_5w8r1GAw2ES94SwM4onm5a";

    // Function bach nclean domain men ay extension
    function cleanDomain(domain) {
      let cleanedDomain = domain.trim().toLowerCase();
      
      // Remove any existing extensions
      extensions.forEach(ext => {
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

    // Function bach ncheck domain availability using RapidAPI
    async function checkSingleDomain(domain) {
      try {
        const response = await fetch(`https://domain-availability-api.p.rapidapi.com/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'domain-availability-api.p.rapidapi.com'
          },
          body: JSON.stringify({
            domain: domain
          })
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        return {
          available: data.available || false,
          status: data.available ? 'available' : 'taken',
          api_response: data
        };

      } catch (error) {
        console.error(`Error checking ${domain}:`, error);
        
        // Fallback: Use WHOIS alternative API
        try {
          const whoisResponse = await fetch(`https://domain-whois-api.p.rapidapi.com/whois`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'domain-whois-api.p.rapidapi.com'
            },
            body: JSON.stringify({
              domain: domain
            })
          });

          if (whoisResponse.ok) {
            const whoisData = await whoisResponse.json();
            const isAvailable = !whoisData.registered || whoisData.status === 'AVAILABLE';
            
            return {
              available: isAvailable,
              status: isAvailable ? 'available' : 'taken',
              method: 'whois_fallback'
            };
          }
        } catch (whoisError) {
          console.error(`WHOIS fallback failed for ${domain}:`, whoisError);
        }

        // If both APIs fail, return error status
        return {
          available: false,
          status: 'error',
          error: error.message
        };
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
            status: result.status,
            method: result.method || 'api'
          });
          
          // Delay bach ma-noverload-ch l'API
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error processing ${fullDomain}:`, error);
          domainResults.push({
            domain: fullDomain,
            available: false,
            status: 'error',
            error: error.message
          });
        }
      }

      results.push({
        baseDomain: baseDomain,
        originalInput: inputDomain,
        extensions: domainResults
      });
    }

    // Count available vs taken
    const allDomains = results.flatMap(r => r.extensions);
    const availableCount = allDomains.filter(d => d.available).length;
    const takenCount = allDomains.filter(d => d.status === 'taken').length;
    const errorCount = allDomains.filter(d => d.status === 'error').length;

    // Return results
    return res.status(200).json({ 
      results,
      success: true,
      summary: {
        total_checked: allDomains.length,
        available: availableCount,
        taken: takenCount,
        errors: errorCount
      }
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

// Alternative: Using Domain Name API (another option)
// Uncomment if you want to use this service instead
/*
async function checkDomainAlternative(domain) {
  try {
    const response = await fetch(`https://domainr.p.rapidapi.com/v2/status`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'domainr.p.rapidapi.com'
      },
      params: {
        domain: domain
      }
    });

    const data = await response.json();
    
    return {
      available: data.status[0].status === 'available',
      status: data.status[0].status,
      api_response: data
    };
  } catch (error) {
    throw error;
  }
}
*/

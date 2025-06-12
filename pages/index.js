import { useState } from 'react';
import Head from 'next/head';

export default function BulkDomainChecker() {
  const [domains, setDomains] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDomain, setCurrentDomain] = useState('');

  const checkDomains = async (e) => {
    e.preventDefault();
    if (!domains.trim()) return;

    const domainList = domains.split('\n').filter(d => d.trim()).slice(0, 2000); // Max 2000 domains
    if (domainList.length === 0) return;

    setLoading(true);
    setResults([]);
    
    // Process domains in batches of 10 for better performance
    const batchSize = 10;
    const allTakenDomains = [];

    for (let i = 0; i < domainList.length; i += batchSize) {
      const batch = domainList.slice(i, i + batchSize);
      setCurrentDomain(`Processing ${i + 1}-${Math.min(i + batchSize, domainList.length)} of ${domainList.length}`);
      
      try {
        const response = await fetch('/api/check-domain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ domains: batch }),
        });

        const data = await response.json();
        
        // Collect only taken domains
        data.results.forEach(result => {
          result.extensions.forEach(ext => {
            if (!ext.available) {
              allTakenDomains.push({
                domain: ext.domain,
                status: 'TAKEN'
              });
            }
          });
        });
        
        setResults([...allTakenDomains]);
        
        // Short delay between batches
        if (i + batchSize < domainList.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error('Error checking batch:', error);
      }
    }

    setLoading(false);
    setCurrentDomain('');
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    let csvContent = "Domain,Status\n";
    results.forEach(result => {
      csvContent += `${result.domain},${result.status}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taken_domains_${new Date().getTime()}.csv`;
    a.click();
  };

  const clearAll = () => {
    setDomains('');
    setResults([]);
  };

  return (
    <>
      <Head>
        <title>Domain Checker - Fast & Simple</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#333', fontSize: '28px', margin: '0 0 10px 0' }}>🔍 Domain Checker</h1>
          <p style={{ color: '#666', margin: '0' }}>Check up to 2000 domains - Shows only TAKEN domains</p>
        </div>

        {/* Search Form */}
        <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <form onSubmit={checkDomains}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              Domain Names (one per line, max 2000):
            </label>
            <textarea
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="example1&#10;example2&#10;example3&#10;mysite&#10;coolname"
              style={{
                width: '100%',
                height: '120px',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                type="submit" 
                disabled={loading || !domains.trim()}
                style={{
                  background: loading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Checking...' : 'Check Domains'}
              </button>
              
              {results.length > 0 && (
                <button 
                  type="button" 
                  onClick={exportResults}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Export CSV ({results.length})
                </button>
              )}
              
              <button 
                type="button" 
                onClick={clearAll}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear All
              </button>
            </div>
          </form>
        </div>

        {/* Loading Status */}
        {loading && (
          <div style={{ 
            background: '#e3f2fd', 
            border: '1px solid #90caf9', 
            padding: '15px', 
            borderRadius: '4px', 
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              border: '2px solid #ddd', 
              borderTop: '2px solid #007bff', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px',
              display: 'inline-block'
            }}></div>
            <div>{currentDomain}</div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ 
              background: '#dc3545', 
              color: 'white', 
              padding: '15px', 
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              ❌ Taken Domains Found: {results.length}
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa', position: 'sticky', top: '0' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd', width: '60px' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Domain</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd', width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 12px', color: '#666', fontSize: '13px' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '14px' }}>
                        {result.domain}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          background: '#dc3545',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          TAKEN
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && domains.trim() && (
          <div style={{ 
            background: '#d4edda', 
            border: '1px solid #c3e6cb', 
            color: '#155724',
            padding: '15px', 
            borderRadius: '4px', 
            textAlign: 'center' 
          }}>
            ✅ Great news! No taken domains found with the checked extensions.
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 600px) {
          table {
            font-size: 12px;
          }
          th, td {
            padding: 8px 6px !important;
          }
        }
      `}</style>
    </>
  );
}

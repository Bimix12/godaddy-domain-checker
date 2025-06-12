import { useState } from 'react';
import Head from 'next/head';

export default function BulkDomainChecker() {
  const [domains, setDomains] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkDomains = async (e) => {
    e.preventDefault();
    if (!domains.trim()) return;

    const domainList = domains.split('\n').filter(d => d.trim());
    if (domainList.length === 0) return;

    setLoading(true);
    setProgress(0);
    setResults([]);

    try {
      const response = await fetch('/api/check-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains: domainList }),
      });

      const data = await response.json();
      
      // Filter to show only taken/unavailable domains
      const takenResults = data.results.map(result => ({
        ...result,
        extensions: result.extensions.filter(ext => !ext.available)
      })).filter(result => result.extensions.length > 0);
      
      setResults(takenResults);
      setProgress(100);
    } catch (error) {
      console.error('Error checking domains:', error);
      alert('Error checking domains');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    let csvContent = "Domain,Extension,Status\n";
    results.forEach(result => {
      result.extensions.forEach(ext => {
        csvContent += `${result.baseDomain},${ext.domain.replace(result.baseDomain, '')},Taken\n`;
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taken_domains.csv';
    a.click();
  };

  const takenCount = results.reduce((count, result) => 
    count + result.extensions.length, 0
  );

  return (
    <>
      <Head>
        <title>Domain Checker - Taken Domains Only</title>
        <meta name="description" content="Find taken domains with specific extensions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🚀 Taken Domain Finder</h1>
          <p>Find taken domains with .net, .co, .co.in, .in, .us extensions</p>
        </header>

        <form onSubmit={checkDomains} className="search-form">
          <div className="input-section">
            <label htmlFor="domains">Enter domain names (one per line, without extensions):</label>
            <textarea
              id="domains"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder={`example:\nmysite\ncoolname\nbusinessname\nstartup`}
              className="domain-textarea"
              disabled={loading}
              rows={8}
            />
            <div className="form-actions">
              <button type="submit" disabled={loading || !domains.trim()} className="search-btn">
                {loading ? `Checking... ${progress}%` : 'Find Taken Domains'}
              </button>
              {results.length > 0 && (
                <button type="button" onClick={exportResults} className="export-btn">
                  Export Results ({takenCount} taken)
                </button>
              )}
            </div>
          </div>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Checking domains... {progress}%</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="results">
            <h2>Taken Domains Found ({takenCount})</h2>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <h3>{result.baseDomain}</h3>
                  <div className="extensions">
                    {result.extensions.map((ext, extIndex) => (
                      <span key={extIndex} className="extension taken">
                        {ext.domain} - TAKEN
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .header h1 {
          font-size: 2.5rem;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .header p {
          color: #6b7280;
          font-size: 1.1rem;
        }
        
        .search-form {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        
        .input-section label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          color: #374151;
        }
        
        .domain-textarea {
          width: 100%;
          padding: 15px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          resize: vertical;
          min-height: 150px;
          font-family: monospace;
        }
        
        .domain-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        
        .search-btn, .export-btn {
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .search-btn {
          background: #2563eb;
          color: white;
          flex: 1;
          min-width: 200px;
        }
        
        .search-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        
        .search-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .export-btn {
          background: #059669;
          color: white;
        }
        
        .export-btn:hover {
          background: #047857;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .results {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .results h2 {
          color: #dc2626;
          margin-bottom: 25px;
          font-size: 1.5rem;
        }
        
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .result-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          background: #fef2f2;
        }
        
        .result-card h3 {
          margin: 0 0 15px 0;
          color: #374151;
          font-size: 1.2rem;
        }
        
        .extensions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .extension {
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .extension.taken {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }
          
          .header h1 {
            font-size: 2rem;
          }
          
          .search-form, .results {
            padding: 20px;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .search-btn {
            min-width: unset;
          }
          
          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

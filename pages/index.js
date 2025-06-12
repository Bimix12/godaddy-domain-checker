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
      setResults(data.results || []);
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
        csvContent += `${result.baseDomain},${ext.domain.replace(result.baseDomain, '')},${ext.status}\n`;
      });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domain_results.csv';
    a.click();
  };

  const availableCount = results.reduce((count, result) => 
    count + result.extensions.filter(ext => ext.available).length, 0
  );

  const takenCount = results.reduce((count, result) => 
    count + result.extensions.filter(ext => !ext.available).length, 0
  );

  return (
    <>
      <Head>
        <title>Bulk Domain Checker - Check Multiple Domains</title>
        <meta name="description" content="Check multiple domain availability with different extensions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🚀 Bulk Domain Checker</h1>
          <p>Check multiple domains across various extensions at once</p>
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
                {loading ? `Checking... ${progress}%` : 'Check All Domains'}
              </button>
              {results.length > 0 && (
                <button type="button" onClick={exportResults} className="export-btn">
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </form>

        {loading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${progress}%`}}></div>
          </div>
        )}

        {results.length > 0 && (
          <div className="stats">
            <div className="stat-card available">
              <h3>{availableCount}</h3>
              <p>Available</p>
            </div>
            <div className="stat-card taken">
              <h3>{takenCount}</h3>
              <p>Taken</p>
            </div>
            <div className="stat-card total">
              <h3>{results.length}</h3>
              <p>Domains Checked</p>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="results">
            <h2>Results ({results.length} domains checked):</h2>
            {results.map((result, index) => (
              <div key={index} className="domain-group">
                <h3 className="domain-base">{result.baseDomain}</h3>
                <div className="extensions-grid">
                  {result.extensions.map((ext, extIndex) => (
                    <div
                      key={extIndex}
                      className={`extension-card ${ext.available ? 'available' : 'taken'}`}
                    >
                      <span className="domain-name">{ext.domain}</span>
                      <span className={`status ${ext.available ? 'available' : 'taken'}`}>
                        {ext.available ? '✅' : '❌'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <style jsx>{`
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
          }

          .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }

          .header p {
            font-size: 1.1rem;
            opacity: 0.9;
          }

          .search-form {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
          }

          .input-section label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
            color: #333;
          }

          .domain-textarea {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            font-family: monospace;
            resize: vertical;
            transition: border-color 0.3s;
          }

          .domain-textarea:focus {
            outline: none;
            border-color: #667eea;
          }

          .form-actions {
            display: flex;
            gap: 15px;
            margin-top: 15px;
            flex-wrap: wrap;
          }

          .search-btn, .export-btn {
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
            white-space: nowrap;
          }

          .search-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            flex: 1;
            min-width: 200px;
          }

          .export-btn {
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
          }

          .search-btn:hover:not(:disabled), .export-btn:hover {
            transform: translateY(-2px);
          }

          .search-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .progress-bar {
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 3px;
            margin-bottom: 20px;
          }

          .progress-fill {
            background: linear-gradient(45deg, #28a745, #20c997);
            height: 20px;
            border-radius: 7px;
            transition: width 0.3s ease;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }

          .stat-card h3 {
            font-size: 2rem;
            margin-bottom: 5px;
          }

          .stat-card.available h3 { color: #22c55e; }
          .stat-card.taken h3 { color: #ef4444; }
          .stat-card.total h3 { color: #667eea; }

          .results {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }

          .results h2 {
            margin-bottom: 30px;
            color: #333;
            text-align: center;
          }

          .domain-group {
            margin-bottom: 30px;
            border: 1px solid #eee;
            border-radius: 10px;
            padding: 20px;
          }

          .domain-base {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3rem;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
          }

          .extensions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
          }

          .extension-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border-radius: 6px;
            border: 1px solid;
            font-size: 0.9rem;
          }

          .extension-card.available {
            background: #f0fff4;
            border-color: #22c55e;
          }

          .extension-card.taken {
            background: #fef2f2;
            border-color: #ef4444;
          }

          .domain-name {
            font-weight: 500;
          }

          .status {
            font-size: 1.1rem;
          }

          @media (max-width: 768px) {
            .container {
              padding: 10px;
            }

            .header h1 {
              font-size: 2rem;
            }

            .form-actions {
              flex-direction: column;
            }

            .search-btn {
              min-width: 100%;
            }

            .extensions-grid {
              grid-template-columns: 1fr;
            }

            .stats {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <style jsx global>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            direction: ltr;
          }
        `}</style>
      </div>
    </>
  );
}

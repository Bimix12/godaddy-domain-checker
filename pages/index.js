import { useState } from 'react';
import Head from 'next/head';

export default function DomainChecker() {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkDomains = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/check-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error checking domains:', error);
      alert('Error checking domains');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Domain Checker - Find Available Domains</title>
        <meta name="description" content="Check domain availability with different extensions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🌐 Domain Checker</h1>
          <p>Search for available domains with different extensions</p>
        </header>

        <form onSubmit={checkDomains} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain name (without extension)"
              className="domain-input"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !domain.trim()} className="search-btn">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {results.length > 0 && (
          <div className="results">
            <h2>Search Results:</h2>
            <div className="results-grid">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`result-card ${result.available ? 'available' : 'taken'}`}
                >
                  <span className="domain-name">{result.domain}</span>
                  <span className={`status ${result.available ? 'available' : 'taken'}`}>
                    {result.available ? '✅ Available' : '❌ Taken'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <style jsx>{`
          .container {
            max-width: 800px;
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

          .input-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .domain-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            min-width: 250px;
            transition: border-color 0.3s;
          }

          .domain-input:focus {
            outline: none;
            border-color: #667eea;
          }

          .search-btn {
            padding: 15px 30px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
            white-space: nowrap;
          }

          .search-btn:hover:not(:disabled) {
            transform: translateY(-2px);
          }

          .search-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .results {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }

          .results h2 {
            margin-bottom: 20px;
            color: #333;
            text-align: center;
          }

          .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
          }

          .result-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid;
            transition: transform 0.2s;
          }

          .result-card:hover {
            transform: translateY(-2px);
          }

          .result-card.available {
            background: #f0fff4;
            border-color: #22c55e;
          }

          .result-card.taken {
            background: #fef2f2;
            border-color: #ef4444;
          }

          .domain-name {
            font-weight: bold;
            font-size: 1.1rem;
          }

          .status {
            font-weight: bold;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9rem;
          }

          .status.available {
            background: #22c55e;
            color: white;
          }

          .status.taken {
            background: #ef4444;
            color: white;
          }

          @media (max-width: 768px) {
            .container {
              padding: 10px;
            }

            .header h1 {
              font-size: 2rem;
            }

            .input-group {
              flex-direction: column;
            }

            .domain-input {
              min-width: 100%;
            }

            .search-btn {
              width: 100%;
            }

            .results-grid {
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

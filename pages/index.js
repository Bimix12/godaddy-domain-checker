// pages/index.js - Modified version
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
      })).filter(result => result.extensions.length > 0); // Only show domains that have taken extensions
      
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

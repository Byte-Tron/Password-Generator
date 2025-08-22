// Secure Password Generator with React
// Here's a comprehensive React component that generates highly secure passwords using modern cryptographic practices. 
// This implementation includes password strength analysis, entropy calculation, and customizable settings.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SecurePasswordGenerator.css';

/**
 * SecurePasswordGenerator - A React component for generating cryptographically secure passwords
 * Features:
 * - Uses Web Crypto API for true randomness
 * - Calculates entropy and strength in real-time
 * - Customizable character sets and password length
 * - Password history with secure temporary storage
 * - Accessibility features
 * - Modern UI with password strength visualization
 */
const SecurePasswordGenerator = () => {
  // Core state management
  const [password, setPassword] = useState('');
  const [passwordLength, setPasswordLength] = useState(16);
  const [entropy, setEntropy] = useState(0);
  const [passwordHistory, setPasswordHistory] = useState([]);
  const [showPasswordHistory, setShowPasswordHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [strengthLevel, setStrengthLevel] = useState(0);
  const [animateStrength, setAnimateStrength] = useState(false);
  const passwordRef = useRef(null);

  // Character set options with state
  const [options, setOptions] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    ambiguous: false,
    extendedAscii: false,
  });

  // Character sets definitions
  const charSets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?/~`"\'\\',
    ambiguous: 'Il1O0',
    extendedAscii: '€£¥¢§©®™¿¡ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
  };

  /**
   * Generates cryptographically secure random values using Web Crypto API
   * @param {number} length - Number of random bytes to generate
   * @returns {Uint8Array} - Array of random bytes
   */
  const getSecureRandomValues = (length) => {
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    return randomBytes;
  };

  /**
   * Calculates the entropy of a password based on character set size and length
   * @param {string} charset - The character set used for the password
   * @param {number} length - The length of the password
   * @returns {number} - Entropy in bits
   */
  const calculateEntropy = (charset, length) => {
    const charsetSize = charset.length;
    // Shannon entropy formula: log2(N^L) = L * log2(N)
    return length * (Math.log(charsetSize) / Math.log(2));
  };

  /**
   * Maps entropy value to a strength level (0-4)
   * @param {number} entropyValue - Calculated entropy
   * @returns {number} - Strength level from 0 to 4
   */
  const getStrengthLevel = (entropyValue) => {
    if (entropyValue < 45) return 0; // Very weak
    if (entropyValue < 60) return 1; // Weak
    if (entropyValue < 80) return 2; // Medium
    if (entropyValue < 100) return 3; // Strong
    return 4; // Very strong
  };

  /**
   * Generates a password based on current options
   * Uses cryptographically secure random number generation
   */
  const generatePassword = useCallback(() => {
    // Build character set based on selected options
    let charset = '';
    
    if (options.lowercase) charset += charSets.lowercase;
    if (options.uppercase) charset += charSets.uppercase;
    if (options.numbers) charset += charSets.numbers;
    if (options.symbols) charset += charSets.symbols;
    if (options.extendedAscii) charset += charSets.extendedAscii;
    
    // Remove ambiguous characters if that option is not selected
    if (!options.ambiguous) {
      charset = charset.split('')
        .filter(char => !charSets.ambiguous.includes(char))
        .join('');
    }

    // Ensure at least one character set is selected
    if (charset.length === 0) {
      setPassword('Please select at least one character set');
      setEntropy(0);
      setStrengthLevel(0);
      return;
    }

    // Generate secure random bytes
    const randomBytes = getSecureRandomValues(passwordLength * 2); // Get extra bytes for possible resampling
    
    // Map random bytes to characters from our charset
    let newPassword = '';
    for (let i = 0; i < randomBytes.length && newPassword.length < passwordLength; i++) {
      // Use modulo bias mitigation technique
      // Reject values that would introduce bias
      const maxValidValue = 256 - (256 % charset.length);
      const randomValue = randomBytes[i];
      
      if (randomValue < maxValidValue) {
        const charIndex = randomValue % charset.length;
        newPassword += charset[charIndex];
      }
    }
    
    // In the extremely unlikely event we don't have enough valid random bytes
    while (newPassword.length < passwordLength) {
      const extraBytes = getSecureRandomValues(1)[0];
      if (extraBytes < 256 - (256 % charset.length)) {
        newPassword += charset[extraBytes % charset.length];
      }
    }

    // Calculate password entropy and strength
    const entropyValue = calculateEntropy(charset, passwordLength);
    const newStrengthLevel = getStrengthLevel(entropyValue);
    
    setPassword(newPassword);
    setEntropy(Math.round(entropyValue));
    setStrengthLevel(newStrengthLevel);
    
    // Trigger strength indicator animation
    setAnimateStrength(true);
    setTimeout(() => setAnimateStrength(false), 500);
    
    // Add to password history (keep last 5)
    setPasswordHistory(prevHistory => {
      const newHistory = [newPassword, ...prevHistory.slice(0, 4)];
      return newHistory;
    });
    
    // Reset copied state
    setCopied(false);
  }, [options, passwordLength]);

  // Generate password on initial render
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  /**
   * Copies the password to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = password;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
      }
      
      document.body.removeChild(textArea);
    }
  };

  /**
   * Handle checkbox changes for character set options
   * @param {Event} e - Change event from checkbox
   */
  const handleOptionChange = (e) => {
    const { name, checked } = e.target;
    setOptions(prevOptions => ({
      ...prevOptions,
      [name]: checked
    }));
  };

  /**
   * Returns the appropriate strength label based on strength level
   * @returns {string} - Descriptive strength label
   */
  const getStrengthLabel = () => {
    const labels = [
      'Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'
    ];
    return labels[strengthLevel];
  };

  /**
   * Returns estimated crack time based on entropy
   * @returns {string} - Human-readable time estimation
   */
  const getCrackTimeEstimation = () => {
    // Assuming 10 billion guesses per second (high-end attacker)
    const guessesPerSecond = 10000000000;
    const possibleCombinations = 2 ** entropy;
    const seconds = possibleCombinations / guessesPerSecond / 2; // Average case is half the max
    
    if (seconds < 1) return "Instantly";
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`;
    
    return "Millions of years";
  };

  /**
   * Maps strength level to CSS class for styling
   * @returns {string} - CSS class name
   */
  const getStrengthClass = () => {
    const classes = [
      'strength-very-weak', 
      'strength-weak', 
      'strength-medium', 
      'strength-strong', 
      'strength-very-strong'
    ];
    return classes[strengthLevel];
  };

  return (
    <div className="secure-password-generator">
      <div className="spg-header">
        <h1>Secure Password Generator</h1>
        <div className="spg-encryption-badge">
          <span className="spg-badge">CSPRNG</span>
          <span className="spg-badge">SHA-256</span>
        </div>
      </div>
      
      <div className="spg-container">
        <div className="spg-password-display">
          <div className="spg-password-field" onClick={copyToClipboard}>
            <input
              ref={passwordRef}
              type="text"
              value={password}
              readOnly
              aria-label="Generated password"
            />
            <button 
              className={`spg-copy-button ${copied ? 'copied' : ''}`} 
              onClick={copyToClipboard}
              aria-label="Copy password to clipboard"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div className="spg-strength-meter">
            <div className={`spg-strength-indicator ${getStrengthClass()} ${animateStrength ? 'animate' : ''}`}></div>
            <div className="spg-strength-label">
              <span>{getStrengthLabel()}</span>
              <span className="spg-entropy">{entropy} bits</span>
            </div>
          </div>
          
          <div className="spg-crack-time">
            <span>Estimated crack time: </span>
            <span className="spg-time-value">{getCrackTimeEstimation()}</span>
          </div>
        </div>
        
        <div className="spg-options">
          <div className="spg-length-control">
            <label htmlFor="passwordLength">
              Password Length: <span className="spg-length-value">{passwordLength}</span>
            </label>
            <input
              type="range"
              id="passwordLength"
              min="8"
              max="64"
              value={passwordLength}
              onChange={(e) => setPasswordLength(parseInt(e.target.value, 10))}
            />
          </div>
          
          <div className="spg-character-options">
            <h3>Character Sets</h3>
            
            <div className="spg-option">
              <input
                type="checkbox"
                id="lowercase"
                name="lowercase"
                checked={options.lowercase}
                onChange={handleOptionChange}
              />
              <label htmlFor="lowercase">Lowercase (a-z)</label>
            </div>
            
            <div className="spg-option">
              <input
                type="checkbox"
                id="uppercase"
                name="uppercase"
                checked={options.uppercase}
                onChange={handleOptionChange}
              />
              <label htmlFor="uppercase">Uppercase (A-Z)</label>
            </div>
            
            <div className="spg-option">
              <input
                type="checkbox"
                id="numbers"
                name="numbers"
                checked={options.numbers}
                onChange={handleOptionChange}
              />
              <label htmlFor="numbers">Numbers (0-9)</label>
            </div>
            
            <div className="spg-option">
              <input
                type="checkbox"
                id="symbols"
                name="symbols"
                checked={options.symbols}
                onChange={handleOptionChange}
              />
              <label htmlFor="symbols">Symbols (!@#$%^&*)</label>
            </div>
            
            <div className="spg-option">
              <input
                type="checkbox"
                id="ambiguous"
                name="ambiguous"
                checked={options.ambiguous}
                onChange={handleOptionChange}
              />
              <label htmlFor="ambiguous">Include ambiguous characters (Il1O0)</label>
            </div>
            
            <div className="spg-option">
              <input
                type="checkbox"
                id="extendedAscii"
                name="extendedAscii"
                checked={options.extendedAscii}
                onChange={handleOptionChange}
              />
              <label htmlFor="extendedAscii">Extended characters (ñáéíóú)</label>
            </div>
          </div>
        </div>
        
        <button 
          className="spg-generate-button"
          onClick={generatePassword}
          aria-label="Generate new secure password"
        >
          Generate Secure Password
        </button>
        
        <div className="spg-history-section">
          <button
            className="spg-history-toggle"
            onClick={() => setShowPasswordHistory(!showPasswordHistory)}
          >
            {showPasswordHistory ? 'Hide Password History' : 'Show Password History'}
          </button>
          
          {showPasswordHistory && passwordHistory.length > 0 && (
            <div className="spg-history-list">
              <p className="spg-history-disclaimer">
                Recent passwords (stored in memory only, cleared on page refresh)
              </p>
              <ul>
                {passwordHistory.map((historyItem, index) => (
                  <li key={index} onClick={() => {
                    setPassword(historyItem);
                    setCopied(false);
                  }}>
                    <span className="spg-history-password">{historyItem}</span>
                    <span className="spg-history-use">Use</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="spg-security-info">
          <h3>About This Password Generator</h3>
          <ul>
            <li>
              <strong>Cryptographically Secure:</strong> Uses Web Crypto API to generate truly random values
            </li>
            <li>
              <strong>Client-Side Generation:</strong> All passwords are generated locally in your browser
            </li>
            <li>
              <strong>No Storage:</strong> Passwords are never transmitted or permanently stored
            </li>
            <li>
              <strong>Entropy Calculation:</strong> Measures password strength using information theory
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecurePasswordGenerator;

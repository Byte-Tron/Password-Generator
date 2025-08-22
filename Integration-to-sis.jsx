import React from 'react';
import SecurePasswordGenerator from './components/SecurePasswordGenerator';

function PasswordPage() {
  return (
    <div className="page-container">
      <h1>Create Your Account Password</h1>
      <p>Use our secure password generator to create a strong password for your account.</p>
      <SecurePasswordGenerator />
    </div>
  );
}

export default PasswordPage;

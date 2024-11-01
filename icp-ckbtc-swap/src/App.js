// src/App.js

import React, { useEffect, useState } from "react";
import { initAuthClient, login, logout } from "./auth";
import SwapComponent from "./SwapComponent";

function App() {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const client = await initAuthClient();
      setAuthClient(client);
      if (await client.isAuthenticated()) {
        setIsAuthenticated(true);
        setPrincipal(client.getIdentity().getPrincipal().toText());
      }
    };
    initAuth();
  }, []);

  const handleLogin = () => {
    login(authClient);
  };

  const handleLogout = () => {
    logout(authClient);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Poppins, sans-serif" }}>
      <h1>ICP-ckBTC Swap Method 2</h1>
      {isAuthenticated ? (
        <div>
          <p>
            <strong>Connected as:</strong> {principal}
          </p>
          <button onClick={handleLogout} style={{ marginBottom: "20px" }}>
            Logout
          </button>
          {/* Swap Interface */}
          <SwapComponent authClient={authClient} principal={principal} />
        </div>
      ) : (
        <button onClick={handleLogin}>Login with Internet Identity</button>
      )}
    </div>
  );
}

export default App;
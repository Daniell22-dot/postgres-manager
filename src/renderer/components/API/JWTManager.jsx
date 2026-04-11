const JWTManager = ({ connectionId }) => {
  const [tokens, setTokens] = useState([]);
  
  const createToken = async (userId, role) => {
    const token = await window.electronAPI.createJWT(connectionId, {
      sub: userId,
      role: role,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    });
    
    return token;
  };
  
  return (
    <div>
      <h3>API Access Tokens</h3>
      <button onClick={() => createToken('new-user', 'authenticated')}>
        Generate Token
      </button>
      {/* Display tokens with copy buttons */}
    </div>
  );
};
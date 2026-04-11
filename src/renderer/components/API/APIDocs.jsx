const APIDocs = ({ apiUrl }) => {
  const [spec, setSpec] = useState(null);
  
  useEffect(() => {
    fetch(`${apiUrl}/`).then(res => res.json()).then(setSpec);
  }, [apiUrl]);
  
  return (
    <div>
      <h3>Auto-generated API Documentation</h3>
      <SwaggerUI spec={spec} />
    </div>
  );
};
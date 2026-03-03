export default function Debug() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Debug</h1>
      <pre style={{ background: '#1e1e1e', color: '#00ff00', padding: '20px', borderRadius: '8px' }}>
        VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || '❌ NOT SET'}
        {'\n'}
        VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ SET (hidden)' : '❌ NOT SET'}
        {'\n'}
        VITE_API_BASE_URL: {import.meta.env.VITE_API_BASE_URL || '(not set)'}
        {'\n\n'}
        MODE: {import.meta.env.MODE}
        {'\n'}
        DEV: {import.meta.env.DEV ? 'true' : 'false'}
        {'\n'}
        PROD: {import.meta.env.PROD ? 'true' : 'false'}
      </pre>
      
      <h2>Supabase Client Status</h2>
      <pre style={{ background: '#1e1e1e', color: '#00ff00', padding: '20px', borderRadius: '8px' }}>
        {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY 
          ? '✅ Supabase should be configured' 
          : '❌ Supabase NOT configured - missing env vars'}
      </pre>
    </div>
  );
}

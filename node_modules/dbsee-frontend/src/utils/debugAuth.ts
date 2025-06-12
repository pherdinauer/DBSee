export const debugAuth = {
  logTokenState: () => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 Debug Auth State:');
    console.log('  Token exists:', !!token);
    console.log('  Token value:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('  Token length:', token?.length || 0);
    
    return {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null
    };
  },

  clearStorage: () => {
    localStorage.removeItem('access_token');
    console.log('🧹 Cleared auth storage');
  },

  testLogin: async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });

      const data = await response.json();
      console.log('🧪 Direct login test result:', data);
      
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        console.log('✅ Token saved to localStorage');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Direct login test failed:', error);
      throw error;
    }
  },

  testCurrentUser: async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      console.log('❌ No token for current user test');
      return null;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('👤 Current user test result:', data);
      return data;
    } catch (error) {
      console.error('❌ Current user test failed:', error);
      throw error;
    }
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
} 
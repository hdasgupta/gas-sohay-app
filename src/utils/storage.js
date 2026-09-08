export const encrypt = (data) => btoa(JSON.stringify(data));

export const decrypt = (str) => {
  try {
    return JSON.parse(atob(str));
  } catch {
    return null;
  }
};

export const saveSession = (user) => {
  localStorage.setItem('app_session', encrypt(user));
};

export const getSession = () => {
  const saved = localStorage.getItem('app_session');
  
  return saved ? decrypt(saved) : null;
};

export const clearSession = () => {
  localStorage.removeItem('app_session');
};

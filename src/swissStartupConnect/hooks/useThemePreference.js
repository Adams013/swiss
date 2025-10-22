import { useCallback, useEffect, useState } from 'react';
import { getInitialTheme, persistThemePreference } from '../utils/theme';

export const useThemePreference = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const rootElement = document.documentElement;
      rootElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
      rootElement.classList.toggle('ssc--dark', isDarkMode);

      if (document.body) {
        document.body.classList.toggle('ssc--dark', isDarkMode);
      }
    }

    persistThemePreference(theme);
    return () => {
      if (typeof document === 'undefined') {
        return;
      }

      const rootElement = document.documentElement;
      rootElement.classList.remove('ssc--dark');
      rootElement.style.colorScheme = '';

      if (document.body) {
        document.body.classList.remove('ssc--dark');
      }
    };
  }, [isDarkMode, theme]);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDarkMode,
    toggleTheme,
  };
};

export default useThemePreference;

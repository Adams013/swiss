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

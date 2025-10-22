import { useState, useCallback } from 'react';

/**
 * Custom hook for managing salary calculator state
 */
export const useSalaryCalculator = () => {
  const [salaryCalculatorOpen, setSalaryCalculatorOpen] = useState(false);
  const [salaryCalculatorRevealed, setSalaryCalculatorRevealed] = useState(false);
  const [salaryCalculatorCompany, setSalaryCalculatorCompany] = useState('');
  const [salaryCalculatorJobId, setSalaryCalculatorJobId] = useState('');
  const [salaryCalculatorPanelVisible, setSalaryCalculatorPanelVisible] = useState(false);
  const [activeSalaryThumb, setActiveSalaryThumb] = useState(null);
  const [activeEquityThumb, setActiveEquityThumb] = useState(null);

  // Open salary calculator
  const openSalaryCalculator = useCallback((job) => {
    setSalaryCalculatorOpen(true);
    setSalaryCalculatorCompany(job?.company_name || '');
    setSalaryCalculatorJobId(job?.id || '');
  }, []);

  // Close salary calculator
  const closeSalaryCalculator = useCallback(() => {
    setSalaryCalculatorOpen(false);
    setSalaryCalculatorRevealed(false);
    setSalaryCalculatorPanelVisible(false);
  }, []);

  return {
    // State
    salaryCalculatorOpen,
    setSalaryCalculatorOpen,
    salaryCalculatorRevealed,
    setSalaryCalculatorRevealed,
    salaryCalculatorCompany,
    setSalaryCalculatorCompany,
    salaryCalculatorJobId,
    setSalaryCalculatorJobId,
    salaryCalculatorPanelVisible,
    setSalaryCalculatorPanelVisible,
    activeSalaryThumb,
    setActiveSalaryThumb,
    activeEquityThumb,
    setActiveEquityThumb,

    // Functions
    openSalaryCalculator,
    closeSalaryCalculator,
  };
};


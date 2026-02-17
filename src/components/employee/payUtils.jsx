export function getCyclesPerYear(payrollSettings) {
  const freq = payrollSettings?.payroll_frequency || 'biweekly';
  if (freq === 'weekly') return 52;
  if (freq === 'biweekly') return 26;
  if (freq === 'semi_monthly') return 24;
  return 12; // monthly
}

export function getPayDisplay(emp, payrollSettings) {
  const cycles = getCyclesPerYear(payrollSettings);

  if (emp.classification === 'salary') {
    const perCycle = emp.pay_per_cycle || 0;
    const annual = perCycle * cycles;
    const monthly = annual / 12;
    return {
      monthly: `$${Math.round(monthly).toLocaleString()}`,
      annual: `$${Math.round(annual).toLocaleString()}`,
      perCycle: `$${perCycle.toLocaleString()}`,
      rate: `$${perCycle.toLocaleString()}/cycle × ${cycles} cycles/yr`,
    };
  }
  if (emp.classification === 'hourly') {
    const monthly = (emp.hourly_rate || 0) * (emp.standard_monthly_hours || 0);
    return {
      monthly: `$${monthly.toLocaleString()}`,
      annual: `$${(monthly * 12).toLocaleString()}`,
      rate: `$${emp.hourly_rate}/hr × ${emp.standard_monthly_hours} hrs/mo`,
    };
  }
  if (emp.classification === 'contractor') {
    if (emp.contractor_billing_type === 'per_project') return { monthly: 'Per Project', annual: 'Per Project' };
    if (emp.contractor_billing_type === 'hourly') {
      const monthly = (emp.contractor_rate || 0) * 160;
      return { monthly: `~$${monthly.toLocaleString()}/mo`, annual: `~$${(monthly * 12).toLocaleString()}/yr`, rate: `$${emp.contractor_rate}/hr` };
    }
    const monthly = emp.contractor_rate || 0;
    return { monthly: `$${monthly.toLocaleString()}`, annual: `$${(monthly * 12).toLocaleString()}` };
  }
  return { monthly: '—', annual: '—' };
}

export function getMonthlyBasePay(emp, payrollSettings) {
  const cycles = getCyclesPerYear(payrollSettings);
  if (emp.classification === 'salary') return ((emp.pay_per_cycle || 0) * cycles) / 12;
  if (emp.classification === 'hourly') return (emp.hourly_rate || 0) * (emp.standard_monthly_hours || 0);
  if (emp.classification === 'contractor') {
    if (emp.contractor_billing_type === 'monthly') return emp.contractor_rate || 0;
    if (emp.contractor_billing_type === 'hourly') return (emp.contractor_rate || 0) * 160;
  }
  return 0;
}
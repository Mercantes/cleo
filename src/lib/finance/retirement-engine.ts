export interface RetirementInput {
  currentPortfolio: number;
  monthlySavings: number;
  targetMonthlyIncome: number;
  annualReturnRate: number; // e.g., 0.08 for 8%
}

export interface RetirementResult {
  fiNumber: number;
  yearsToFI: number;
  monthsToFI: number;
  gap: number; // required - current monthly savings
  requiredMonthlySavings: number;
  portfolioTimeline: { year: number; balance: number }[];
  scenarios: RetirementScenario[];
}

export interface RetirementScenario {
  extraMonthly: number;
  yearsToFI: number;
  yearsSaved: number;
}

function simulateYearsToFI(
  currentPortfolio: number,
  monthlySavings: number,
  monthlyRate: number,
  target: number,
): number {
  if (monthlySavings <= 0 && currentPortfolio >= target) return 0;
  if (monthlySavings <= 0 && currentPortfolio < target && monthlyRate <= 0) return -1;

  let balance = currentPortfolio;
  let months = 0;
  const maxMonths = 600; // 50 years cap

  while (balance < target && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlySavings;
    months++;
  }

  return months >= maxMonths ? -1 : months / 12;
}

function calculateRequiredPMT(
  target: number,
  currentPortfolio: number,
  monthlyRate: number,
  totalMonths: number,
): number {
  if (monthlyRate === 0) {
    return (target - currentPortfolio) / totalMonths;
  }
  const growthFactor = Math.pow(1 + monthlyRate, totalMonths);
  const futureValueOfPrincipal = currentPortfolio * growthFactor;
  const annuityFactor = (growthFactor - 1) / monthlyRate;
  return (target - futureValueOfPrincipal) / annuityFactor;
}

export function calculateRetirement(input: RetirementInput): RetirementResult {
  const { currentPortfolio, monthlySavings, targetMonthlyIncome, annualReturnRate } = input;

  // FIRE number: 25x annual expenses (4% rule)
  const fiNumber = targetMonthlyIncome * 12 * 25;
  const monthlyRate = annualReturnRate / 12;

  // Years to FI
  const yearsToFI = simulateYearsToFI(currentPortfolio, monthlySavings, monthlyRate, fiNumber);
  const monthsToFI = yearsToFI >= 0 ? Math.round(yearsToFI * 12) : -1;

  // Gap analysis: required savings to reach FI in 20 years (default target)
  const targetYears = 20;
  const requiredMonthlySavings = calculateRequiredPMT(
    fiNumber,
    currentPortfolio,
    monthlyRate,
    targetYears * 12,
  );
  const gap = Math.round((requiredMonthlySavings - monthlySavings) * 100) / 100;

  // Portfolio timeline (year by year)
  const timelineYears = Math.min(Math.max(Math.ceil(yearsToFI > 0 ? yearsToFI : 30), 10), 50);
  const portfolioTimeline: { year: number; balance: number }[] = [];
  let balance = currentPortfolio;
  for (let y = 0; y <= timelineYears; y++) {
    portfolioTimeline.push({ year: y, balance: Math.round(balance) });
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlySavings;
    }
  }

  // Scenarios: what if you save X more per month?
  const extraAmounts = [200, 500, 1000];
  const scenarios: RetirementScenario[] = extraAmounts.map((extra) => {
    const scenarioYears = simulateYearsToFI(
      currentPortfolio,
      monthlySavings + extra,
      monthlyRate,
      fiNumber,
    );
    return {
      extraMonthly: extra,
      yearsToFI: Math.round(scenarioYears * 10) / 10,
      yearsSaved: Math.round((yearsToFI - scenarioYears) * 10) / 10,
    };
  });

  return {
    fiNumber: Math.round(fiNumber),
    yearsToFI: Math.round(yearsToFI * 10) / 10,
    monthsToFI,
    gap,
    requiredMonthlySavings: Math.round(requiredMonthlySavings * 100) / 100,
    portfolioTimeline,
    scenarios,
  };
}

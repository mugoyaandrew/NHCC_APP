/**
 * AI Engine — Client-side intelligence for NHCC + Finara
 * No external APIs needed. All runs in the browser.
 */

// ============================================================
// 1. EXPENSE AUTO-CATEGORIZATION (Keyword Classifier)
// ============================================================

const CATEGORY_KEYWORDS = {
  needs: {
    rent: ['rent', 'landlord', 'housing', 'apartment', 'lease', 'tenant'],
    groceries: ['grocery', 'groceries', 'supermarket', 'food', 'market', 'shoprite', 'capital shoppers', 'carrefour', 'fresh', 'vegetables', 'meat', 'milk'],
    utilities: ['electricity', 'electric', 'water', 'umeme', 'nwsc', 'gas', 'utility', 'bill', 'airtime', 'data', 'internet', 'wifi', 'power'],
    transportation: ['uber', 'bolt', 'safeboda', 'taxi', 'boda', 'fuel', 'petrol', 'diesel', 'parking', 'transport', 'bus', 'matatu', 'car wash'],
    healthcare: ['hospital', 'clinic', 'doctor', 'pharmacy', 'medicine', 'medical', 'health', 'dental', 'lab', 'test', 'prescription', 'insurance'],
  },
  wants: {
    dining: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'chicken', 'dinner', 'lunch', 'brunch', 'bar', 'drinks', 'beer', 'wine', 'javas', 'kfc', 'dominos', 'nandos'],
    entertainment: ['movie', 'cinema', 'concert', 'game', 'sports', 'gym', 'fitness', 'club', 'party', 'festival', 'show', 'ticket'],
    shopping: ['clothes', 'shoes', 'bag', 'watch', 'electronics', 'phone', 'laptop', 'gadget', 'amazon', 'jumia', 'fashion', 'mall', 'gift'],
    subscriptions: ['netflix', 'spotify', 'youtube', 'apple', 'google', 'subscription', 'premium', 'dstv', 'gotv', 'hbo', 'disney'],
  },
  savings: {
    emergency_fund: ['emergency', 'rainy day', 'safety net', 'backup'],
    investments: ['invest', 'stocks', 'shares', 'sacco', 'bond', 'mutual fund', 'portfolio', 'trading'],
    retirement: ['retire', 'pension', 'nssf', 'provident'],
  },
};

// User's learned patterns from localStorage
function getLearnedPatterns() {
  try {
    return JSON.parse(localStorage.getItem('ai_learned_patterns') || '{}');
  } catch { return {}; }
}

function learnPattern(description, category, subcategory) {
  const patterns = getLearnedPatterns();
  const key = description.toLowerCase().trim();
  patterns[key] = { category, subcategory, count: (patterns[key]?.count || 0) + 1 };
  localStorage.setItem('ai_learned_patterns', JSON.stringify(patterns));
}

export function classifyExpense(description) {
  if (!description || description.length < 2) return null;
  const desc = description.toLowerCase().trim();

  // Check learned patterns first
  const learned = getLearnedPatterns();
  for (const [key, val] of Object.entries(learned)) {
    if (desc.includes(key) || key.includes(desc)) {
      return { category: val.category, subcategory: val.subcategory, confidence: 0.95, source: 'learned' };
    }
  }

  // Keyword matching
  let bestMatch = null;
  let bestScore = 0;

  for (const [category, subcategories] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const [subcategory, keywords] of Object.entries(subcategories)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          const score = keyword.length / desc.length; // longer keyword match = higher confidence
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { category, subcategory, confidence: Math.min(0.9, 0.5 + score), source: 'keyword' };
          }
        }
      }
    }
  }

  return bestMatch;
}

export { learnPattern };

// ============================================================
// 2. ANOMALY DETECTION (Z-Score + IQR Method)
// ============================================================

function calculateStats(values) {
  if (!values || values.length === 0) return { mean: 0, std: 0, median: 0, q1: 0, q3: 0, iqr: 0 };
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  return { mean, std, median, q1, q3, iqr };
}

export function detectAnomalies(expenses) {
  if (!expenses || expenses.length < 3) return [];
  const anomalies = [];

  // Group by category
  const byCategory = {};
  for (const exp of expenses) {
    if (!byCategory[exp.category]) byCategory[exp.category] = [];
    byCategory[exp.category].push(exp);
  }

  // Check each category for anomalies
  for (const [category, catExpenses] of Object.entries(byCategory)) {
    const amounts = catExpenses.map(e => e.amount);
    const stats = calculateStats(amounts);

    if (stats.std === 0) continue;

    // Find expenses that are > 2 standard deviations above mean
    for (const exp of catExpenses) {
      const zScore = (exp.amount - stats.mean) / stats.std;
      if (zScore > 1.8) {
        anomalies.push({
          type: 'high_expense',
          expense: exp,
          category,
          zScore: zScore.toFixed(1),
          avgAmount: stats.mean,
          message: `Your "${exp.description}" (${formatNum(exp.amount)}) is ${Math.round((exp.amount / stats.mean - 1) * 100)}% above your average ${category} expense of ${formatNum(stats.mean)}.`,
          severity: zScore > 3 ? 'high' : 'medium',
        });
      }
    }

    // Check if total category spending is spiking
    const totalCat = amounts.reduce((s, v) => s + v, 0);
    const avgPerExpense = stats.mean;
    const expectedTotal = avgPerExpense * Math.min(catExpenses.length, 10);
    if (totalCat > expectedTotal * 1.5 && catExpenses.length >= 3) {
      anomalies.push({
        type: 'category_spike',
        category,
        total: totalCat,
        expected: expectedTotal,
        message: `Your ${category} spending is ${Math.round((totalCat / expectedTotal) * 100)}% of the expected pattern.`,
        severity: totalCat > expectedTotal * 2 ? 'high' : 'medium',
      });
    }
  }

  return anomalies.slice(0, 5); // Top 5 anomalies
}

// ============================================================
// 3. PREDICTIVE FORECASTING (Linear Regression)
// ============================================================

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const { x, y } of points) {
    sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x; sumY2 += y * y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const ssTot = points.reduce((s, p) => s + Math.pow(p.y - yMean, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

export function forecastSpending(expenses) {
  if (!expenses || expenses.length < 3) return null;

  // Group expenses by day and calculate cumulative spending
  const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstDate = new Date(sorted[0].date);

  const points = sorted.map((exp, i) => ({
    x: Math.floor((new Date(exp.date) - firstDate) / (1000 * 60 * 60 * 24)),
    y: sorted.slice(0, i + 1).reduce((s, e) => s + e.amount, 0),
  }));

  const { slope, intercept, r2 } = linearRegression(points);

  const today = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24));
  const daysInMonth = 30;
  const currentTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const projectedMonthly = slope * daysInMonth + intercept;
  const dailyRate = slope;

  return {
    dailyRate: Math.max(0, dailyRate),
    projectedMonthly: Math.max(currentTotal, projectedMonthly),
    currentTotal,
    confidence: Math.max(0, r2),
    daysTracked: today,
    trend: slope > 0 ? 'increasing' : 'stable',
  };
}

export function forecastGoal(goal, monthlySavings) {
  if (!goal || !monthlySavings || monthlySavings <= 0) return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return { monthsLeft: 0, onTrack: true, projectedDate: 'Completed!' };

  const monthsLeft = remaining / monthlySavings;
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + Math.ceil(monthsLeft));

  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const onTrack = deadline ? projectedDate <= deadline : true;

  return {
    monthsLeft: Math.round(monthsLeft * 10) / 10,
    projectedDate: projectedDate.toLocaleDateString('en-UG', { year: 'numeric', month: 'short' }),
    onTrack,
    deadlineDiff: deadline ? Math.round((deadline - projectedDate) / (1000 * 60 * 60 * 24 * 30)) : null,
  };
}

// ============================================================
// 4. VOICE COMMAND PARSER (NLP)
// ============================================================

const VOICE_COMMANDS = [
  // Navigation
  { patterns: ['go to dashboard', 'show dashboard', 'open dashboard', 'dashboard'], action: 'navigate', target: '/dashboard' },
  { patterns: ['go to projects', 'show projects', 'open projects', 'projects'], action: 'navigate', target: '/projects' },
  { patterns: ['go to tasks', 'show tasks', 'open tasks', 'tasks', 'kanban'], action: 'navigate', target: '/tasks' },
  { patterns: ['go to documents', 'show documents', 'open documents', 'documents', 'files'], action: 'navigate', target: '/documents' },
  { patterns: ['go to messages', 'show messages', 'open messages', 'messages', 'inbox'], action: 'navigate', target: '/messages' },
  { patterns: ['go to calendar', 'show calendar', 'open calendar', 'calendar'], action: 'navigate', target: '/calendar' },
  { patterns: ['go to announcements', 'show announcements', 'announcements'], action: 'navigate', target: '/announcements' },
  { patterns: ['go to approvals', 'show approvals', 'approvals'], action: 'navigate', target: '/approvals' },
  { patterns: ['go to site reports', 'show site reports', 'site reports'], action: 'navigate', target: '/site-reports' },
  { patterns: ['go to reports', 'show reports', 'reports', 'analytics'], action: 'navigate', target: '/reports' },
  { patterns: ['go to users', 'show users', 'user management'], action: 'navigate', target: '/users' },

  // Finara navigation
  { patterns: ['switch to finara', 'open finara', 'finara', 'finance', 'my finances'], action: 'navigate', target: '/finara/dashboard' },
  { patterns: ['show income', 'my income', 'income'], action: 'navigate', target: '/finara/income' },
  { patterns: ['show expenses', 'my expenses', 'expenses', 'spending'], action: 'navigate', target: '/finara/expenses' },
  { patterns: ['show goals', 'my goals', 'goals', 'savings goals'], action: 'navigate', target: '/finara/goals' },
  { patterns: ['show accounts', 'my accounts', 'accounts', 'bank accounts'], action: 'navigate', target: '/finara/accounts' },
  { patterns: ['show investments', 'my investments', 'investments', 'portfolio'], action: 'navigate', target: '/finara/investments' },
  { patterns: ['settings', 'preferences', 'show settings'], action: 'navigate', target: '/finara/settings' },

  // App switching
  { patterns: ['switch to nhcc', 'open nhcc', 'nhcc', 'portal'], action: 'navigate', target: '/dashboard' },

  // Actions
  { patterns: ['dark mode', 'toggle dark', 'night mode'], action: 'toggle_dark' },
  { patterns: ['light mode', 'toggle light', 'day mode'], action: 'toggle_light' },
  { patterns: ['log out', 'logout', 'sign out'], action: 'logout' },
  { patterns: ['open advisor', 'ai advisor', 'help me', 'financial advice', 'advisor'], action: 'open_advisor' },
];

export function parseVoiceCommand(transcript) {
  const text = transcript.toLowerCase().trim();

  // Check for "add expense" pattern: "add expense 50000 for groceries"
  const addExpenseMatch = text.match(/add (?:an? )?expense (?:of )?(\d[\d,]*)\s*(?:for|on|to)\s+(.+)/i);
  if (addExpenseMatch) {
    const amount = parseInt(addExpenseMatch[1].replace(/,/g, ''));
    const description = addExpenseMatch[2].trim();
    const classification = classifyExpense(description);
    return {
      action: 'add_expense',
      data: { amount, description, ...classification },
      response: `Adding expense: ${description} for ${formatNum(amount)}${classification ? ` (${classification.subcategory})` : ''}`,
    };
  }

  // Check for balance query
  if (text.includes('balance') || text.includes('how much do i have') || text.includes('how much money')) {
    return { action: 'query_balance', response: null }; // response filled by component
  }

  // Check for spending query
  if (text.includes('spending') || text.includes('how much have i spent') || text.includes('total expenses')) {
    return { action: 'query_spending', response: null };
  }

  // Match against known commands
  for (const cmd of VOICE_COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (text.includes(pattern)) {
        return {
          action: cmd.action,
          target: cmd.target,
          response: cmd.action === 'navigate' ? `Navigating to ${cmd.target.replace(/\//g, ' ').replace('finara', 'Finara').trim()}` : `Executing: ${pattern}`,
        };
      }
    }
  }

  return { action: 'unknown', response: `Sorry, I didn't understand "${transcript}". Try "go to projects" or "show my expenses".` };
}

// ============================================================
// 5. AI ADVISOR (Rule-Based Financial Analysis)
// ============================================================

export function generateAdvisorResponse(question, financialData) {
  const q = question.toLowerCase().trim();
  const { totalIncome = 0, totalExpenses = 0, totalBalance = 0, expensesByCategory = [], goalsProgress = [], recentExpenses = [], incomeByCategory = [] } = financialData || {};

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

  // Greeting
  if (q.match(/^(hi|hello|hey|good morning|good evening|good afternoon)/)) {
    return { text: `Hello! 👋 I'm your AI Financial Advisor. I can analyze your spending, forecast goals, and give personalized tips. Try asking:\n\n• "How am I doing this month?"\n• "Where am I spending the most?"\n• "Can I afford a 2M purchase?"\n• "How long until I reach my goals?"\n• "Give me a savings tip"`, type: 'greeting' };
  }

  // How am I doing
  if (q.includes('how am i doing') || q.includes('financial health') || q.includes('overview') || q.includes('summary')) {
    const status = savingsRate > 20 ? '🟢 Great' : savingsRate > 10 ? '🟡 Fair' : '🔴 Needs attention';
    return {
      text: `📊 **Monthly Financial Health: ${status}**\n\n💰 Income: ${formatNum(totalIncome)}\n💸 Expenses: ${formatNum(totalExpenses)}\n📈 Savings: ${formatNum(balance)} (${savingsRate}% rate)\n🏦 Bank Balance: ${formatNum(totalBalance)}\n\n${savingsRate > 20 ? "You're saving well! Keep it up. The recommended savings rate is 20%+." : savingsRate > 10 ? "You're doing okay, but try to increase your savings rate to 20%." : "⚠️ Your savings rate is low. Consider cutting discretionary spending."}`,
      type: 'analysis',
    };
  }

  // Where am I spending the most
  if (q.includes('spending the most') || q.includes('top expenses') || q.includes('biggest expense') || q.includes('where does my money go')) {
    const sorted = [...expensesByCategory].sort((a, b) => b.total - a.total);
    const breakdown = sorted.map((c, i) => `${i + 1}. **${c.category}**: ${formatNum(c.total)} (${totalExpenses > 0 ? Math.round(c.total / totalExpenses * 100) : 0}%)`).join('\n');
    return {
      text: `📊 **Spending Breakdown:**\n\n${breakdown || 'No expense data yet.'}\n\n${sorted[0]?.category === 'wants' ? "💡 Tip: Your discretionary ('wants') spending is your top category. Consider if some of these can be reduced." : "Your spending pattern looks reasonable with needs being prioritized."}`,
      type: 'analysis',
    };
  }

  // Can I afford
  const affordMatch = q.match(/can i (?:afford|buy|spend|get)\s+(?:a\s+)?(\d[\d,]*[km]?)/i);
  if (affordMatch || q.includes('afford')) {
    let amount = 0;
    if (affordMatch) {
      let amtStr = affordMatch[1].replace(/,/g, '');
      if (amtStr.endsWith('k')) amount = parseFloat(amtStr) * 1000;
      else if (amtStr.endsWith('m')) amount = parseFloat(amtStr) * 1000000;
      else amount = parseFloat(amtStr);
    } else {
      amount = 1000000; // default
    }

    const canAfford = totalBalance >= amount;
    const impactPct = totalBalance > 0 ? Math.round(amount / totalBalance * 100) : 100;
    return {
      text: `${canAfford ? '✅' : '⚠️'} **Can you afford ${formatNum(amount)}?**\n\n🏦 Current Balance: ${formatNum(totalBalance)}\n💳 Purchase Amount: ${formatNum(amount)}\n📉 Impact: ${impactPct}% of your balance\n💰 Remaining: ${formatNum(totalBalance - amount)}\n\n${canAfford ? (impactPct > 50 ? "You can technically afford it, but it would use over half your balance. Consider saving more first." : "Yes! This purchase is within your means.") : "This would exceed your current balance. Consider saving up first or adjusting your budget."}`,
      type: 'analysis',
    };
  }

  // Goals timeline
  if (q.includes('goal') || q.includes('how long') || q.includes('reach') || q.includes('target')) {
    const monthlySavings = Math.max(0, balance);
    const goalAnalysis = (goalsProgress || []).map(g => {
      const forecast = forecastGoal(g, monthlySavings);
      const pct = g.target_amount > 0 ? Math.round(g.current_amount / g.target_amount * 100) : 0;
      return `${g.icon} **${g.title}** — ${pct}% complete\n   ${forecast ? `Est. completion: ${forecast.projectedDate} (${forecast.monthsLeft} months)` : 'Need more savings data'}${forecast?.onTrack === false ? ' ⚠️ Behind schedule' : ''}`;
    }).join('\n\n');

    return {
      text: `🎯 **Goals Forecast** (based on ${formatNum(monthlySavings)}/mo savings):\n\n${goalAnalysis || 'No goals set yet. Create some goals to get forecasts!'}\n\n${monthlySavings === 0 ? "⚠️ You're not saving this month. Adjust your budget to make progress on goals." : ""}`,
      type: 'forecast',
    };
  }

  // Savings tip
  if (q.includes('tip') || q.includes('advice') || q.includes('suggest') || q.includes('recommend') || q.includes('help')) {
    const tips = [];
    const needsPct = expensesByCategory.find(c => c.category === 'needs')?.total || 0;
    const wantsPct = expensesByCategory.find(c => c.category === 'wants')?.total || 0;

    if (totalExpenses > 0 && wantsPct / totalExpenses > 0.3) {
      tips.push("🎯 **50/30/20 Rule**: Your 'wants' spending is above 30% of expenses. Try the 50/30/20 split: 50% needs, 30% wants, 20% savings.");
    }
    if (savingsRate < 20) {
      tips.push(`📈 **Boost Savings**: Your savings rate is ${savingsRate}%. Aim for 20%. That's an extra ${formatNum(totalIncome * 0.2 - balance)} per month.`);
    }
    if (recentExpenses.some(e => e.subcategory === 'dining')) {
      tips.push("🍽️ **Reduce Dining Out**: Cooking at home can save 50-70% on food expenses. Try meal prepping on weekends.");
    }
    if (recentExpenses.some(e => e.subcategory === 'subscriptions')) {
      tips.push("📱 **Audit Subscriptions**: Review your subscriptions. Cancel ones you haven't used in the past month.");
    }
    tips.push("💡 **Automate Savings**: Set up automatic transfers to your savings account on payday before you spend.");
    tips.push("🎯 **Emergency Fund**: Aim for 3-6 months of expenses as an emergency fund.");

    const selected = tips.slice(0, 3);
    return {
      text: `💡 **Personalized Tips:**\n\n${selected.join('\n\n')}`,
      type: 'tip',
    };
  }

  // Fallback
  return {
    text: `I'm not sure about that, but I can help with:\n\n• 📊 "How am I doing?" — financial health check\n• 💰 "Where am I spending the most?" — breakdown\n• 🛒 "Can I afford [amount]?" — purchase analysis\n• 🎯 "How long until my goals?" — forecasting\n• 💡 "Give me tips" — personalized advice\n\nTry asking one of these!`,
    type: 'help',
  };
}

// Utility
function formatNum(n) {
  if (n === null || n === undefined) return 'UGX 0';
  return `UGX ${Math.round(Number(n)).toLocaleString()}`;
}

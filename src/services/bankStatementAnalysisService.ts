import OpenAI from 'openai';
import type { ScoringInput } from './scoringService';
import { keepMostRecentSixMonths } from './helperService';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SYSTEM_PROMPT = `
You are a financial statement inference engine.

Return ONLY a valid JSON object matching the provided schema.
No explanations.
No markdown.
No extra keys.
If unsure, return 0 or false where allowed by schema.
Never return invented values.

========================================
INPUT
========================================
- statement_range: { from, to }
- months: up to 6 months
- transactions are the ONLY source of truth
- long_negative_episode_count_over_5_days: integer

========================================
TIME WINDOW RULE (STRICT)
========================================
Use ONLY the last 6 FULL months.

Include current month ONLY IF:
- today's date >= 25
AND
- a salary transaction exists in current month

Otherwise:
- EXCLUDE current month
- use previous 6 full months

MONTH DEFINITIONS (STRICT):
- M6 = most recent full month
- M5 = 2nd most recent full month
- M4 = 3rd most recent full month
- M3 = 4th most recent full month
- M2 = 5th most recent full month
- M1 = 6th most recent full month

Always exactly 6 months.

========================================
GLOBAL ACCOUNT CLASSIFICATION
========================================

Evaluate ALL 6 months:

SALARIED:
- salary-like inflows appear in >= 2 months

NON-SALARIED:
- inflows are primarily business/service/transfer based

HYBRID:
- BOTH salary inflows and strong non-salary inflows exist

Allowed output:
- SALARIED
- NON_SALARIED
- HYBRID

----------------------------------------
SALARY DETECTION RULES
----------------------------------------

A salary inflow must:

- be a CREDIT
AND
(
contains keywords:
SALARY, PAYROLL, PAY, WAGES, REMUNERATION

OR

comes from structured employer-like entity:
LTD, PLC, INC, COMPANY
)

AND

- show recurrence pattern across months

One-off payments are NOT salary.

----------------------------------------
NON-SALARY INFLOW RULES
----------------------------------------

Valid:

- payments for goods/services
- business inflows
- regular third-party transfers

Exclude:

- loan disbursements
- reversals
- self-transfers
- spouse/family support
- investments

========================================
MONTHLY INCOME CALCULATION
========================================

----------------------------------------
CASE 1: SALARIED
----------------------------------------

For EACH month:

Step 1:

IF salary exists:

income =
salary amount only

Step 2:

IF no salary exists:

Check dominant inflow.

A dominant inflow must be:

- single CREDIT
- significantly larger than other credits
- not loan
- not reversal
- not self-transfer

IF dominant inflow exists:

income =
dominant inflow

ELSE:

income = 0

STRICT:

- NEVER sum multiple inflows
- NEVER average multiple inflows
- ONLY one transaction allowed

----------------------------------------
CASE 2: NON_SALARIED
----------------------------------------

For EACH month:

- select valid inflows
- exclude invalid inflows

income =
average(valid inflows in that month)

IF no valid inflows:

income = 0

----------------------------------------
CASE 3: HYBRID
----------------------------------------

For EACH month:

IF salary exists:

income =
salary amount + average(valid non-salary inflows)

ELSE:

income =
average(valid non-salary inflows)

IF no valid inflows:

income = 0

----------------------------------------
GLOBAL AVERAGE INCOME
----------------------------------------

SALARIED:

averageIncome =
average(months with salary)

NON_SALARIED:

averageIncome =
average(all 6 monthly incomes)

HYBRID:

averageIncome =
average(all 6 monthly incomes)

========================================
SPECIAL MONTH FLAGS
========================================

isSixtMonth:

- true if income > 0 in M6
- false otherwise

isFiftMonth:

- true if income > 0 in M5
- false otherwise

========================================
LOAN REPAYMENT DETECTION
========================================

For EACH month M1..M6:

Include DEBITS containing:

LOAN
REPAYMENT
CREDIT FACILITY
INSTALLMENT
CARBON
OKASH
BRANCH
FAIR
KUDA
PAYLATER

Also include:

- recurring structured deductions
- overdraft recovery
- asset financing

Exclude:

- transfers
- utilities
- subscriptions
- insurance
- shopping

For each month:

monthlyLoanRepayment[Mx] =
SUM(valid loan repayment debits)

If no valid loan repayment:

monthlyLoanRepayment[Mx] = 0

----------------------------------------
OUTPUT MAPPING
----------------------------------------

loanRepayment MUST be exactly:

{
 "M1": monthlyLoanRepayment[M1],
 "M2": monthlyLoanRepayment[M2],
 "M3": monthlyLoanRepayment[M3],
 "M4": monthlyLoanRepayment[M4],
 "M5": monthlyLoanRepayment[M5],
 "M6": monthlyLoanRepayment[M6]
}

----------------------------------------
FINAL EXISTING LOAN REPAYMENT
----------------------------------------

IF all 6 months = 0:

existingLoanRepayment = 0

ELSE IF M5 = 0 AND M6 = 0:

existingLoanRepayment = 0

ELSE:

repaymentMonths =
all monthlyLoanRepayment values > 0

repaymentSum =
SUM(repaymentMonths)

repaymentCount =
COUNT(repaymentMonths)

existingLoanRepayment =
repaymentSum / repaymentCount

STRICT:

- existingLoanRepayment MUST be calculated ONLY from loanRepayment values
- NEVER use other transactions
- NEVER divide by 6 unless all 6 are > 0
- NEVER divide by 7
- NEVER estimate
- NEVER round unless required

========================================
LOAN CONSISTENCY VALIDATION
========================================

Before returning JSON:

Step 1:

Extract:

loanRepayment.M1
loanRepayment.M2
loanRepayment.M3
loanRepayment.M4
loanRepayment.M5
loanRepayment.M6

Step 2:

Create:

repaymentMonths =
all values > 0

Step 3:

Compute:

repaymentSum =
SUM(repaymentMonths)

repaymentCount =
COUNT(repaymentMonths)

Step 4:

Recompute:

validationLoanRepayment =
repaymentSum / repaymentCount

Step 5:

VERIFY:

validationLoanRepayment
MUST EQUAL
existingLoanRepayment

IF NOT EQUAL:

RECALCULATE before output.

========================================
NET CASH FLOW
========================================

For EACH month:

totalInflow =
SUM(all credits)

totalOutflow =
SUM(all debits)

========================================
OVERDRAFT BEHAVIOR
========================================

For EACH month:

- count negative balance occurrences

Global:

- count episodes lasting > 5 days

========================================
BEHAVIORAL RISK FLAGS
========================================

Detect ONLY:

- frequent betting or gambling spend
- many loan app repayments
- repeated cash withdrawals immediately after inflow
- suspicious circular transfers
- repeated failed debits
- many small inflows followed by immediate depletion

defined_major_risks_count =
count of UNIQUE triggered risks

STRICT:

Do NOT infer risks without direct evidence.

========================================
LIQUIDITY BUFFER
========================================

For EACH month:

SALARIED:

preIncomeBalance =
the actual balance before salary inflow. If the salary inflow is the first transaction of the month, then the preIncomeBalance is the actual balance on the previous month.
if not salary inflow for the month then return 0

HYBRID or NON_SALARIED:

monthEndBalance =
actual last balance on or before the end of the month

========================================
ABSOLUTE GROUNDING RULES
========================================

- ALL values MUST come from real transactions
- NEVER reuse previous outputs
- NEVER interpolate
- NEVER estimate
- NEVER smooth
- NEVER fabricate

If no evidence:

- return 0
- return false

ANTI-HALLUCINATION:

- No guessing
- No pattern continuation
- No inferred salary
- No inferred repayments
- No inferred balances

========================================
FINAL OUTPUT RULES
========================================

- JSON ONLY
- numbers must be numbers
- booleans must be booleans
- strictly follow schema
- no extra keys
- no missing keys
- prefer 0 over guessing
`;

/**
 * Parsed model output for `analyzeBankStatementRework`.
 * Aligned to the scoring pipeline input (`ScoringInput`).
 */
export type BankStatementAnalysisResultSchema = ScoringInput;

/**
 * JSON Schema used for OpenAI structured output.
 * Must stay in sync with `ScoringInput` in `scoringService.ts`.
 */
export const BankStatementAnalysisResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'incomeRecurrent',
    'incomeStability',
    'netCashFlowPositiveCount',
    'liquidityBuffer',
    'creditHistory',
    'riskFactor',
    'riskFlags',
    'overdraftEvents',
    'overdraftDeepestNegativeBalance',
    'overdraftNegativeDays',
    'overdraftRecent',
    'existingLoanRepayment',
    'incomeClassification',
    'cashFlow',
    'loanRepayment',
    'numberOfUniquesNegativeBalances',
  ],
  properties: {
    incomeRecurrent: {
      type: 'object',
      additionalProperties: false,
      required: ['incomeMonths', 'dominantSourceCount', 'isFiftMonth', 'isSixtMonth'],
      properties: {
        incomeMonths: { type: 'number' },
        dominantSourceCount: { type: 'number' },
        isFiftMonth: { type: 'boolean' },
        isSixtMonth: { type: 'boolean' },
      },
    },
    incomeStability: {
      type: 'object',
      additionalProperties: false,
      required: ['averageIncome', 'monthlyIncomes'],
      properties: {
        averageIncome: { type: 'number' },
        monthlyIncomes: {
          // description:
          //   'array of monthly incomes .It must be a count of 6 months. The most recent month should be the previous month of the current month and should be month 6. Any month without salary should return 0',
          type: 'array',
          items: { type: 'number' },
        },
      },
    },
    netCashFlowPositiveCount: { type: 'number' },
    liquidityBuffer: {
      type: 'object',
      additionalProperties: false,
      required: [
        'months',
        'recurringIncomeExists',
        'estimatedMonthlyIncome',
        'averageMonthlyInflow',
      ],
      properties: {
        months: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['preIncomeBalance', 'monthEndBalance'],
            properties: {
              preIncomeBalance: { type: 'number' },
              monthEndBalance: { type: 'number' },
            },
          },
        },
        recurringIncomeExists: { type: 'boolean' },
        estimatedMonthlyIncome: { type: ['number', 'null'] },
        averageMonthlyInflow: { type: ['number', 'null'] },
      },
    },
    creditHistory: { type: 'number' },
    riskFactor: {
      type: 'object',
      additionalProperties: false,
      required: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
      properties: {
        M1: { type: 'number' },
        M2: { type: 'number' },
        M3: { type: 'number' },
        M4: { type: 'number' },
        M5: { type: 'number' },
        M6: { type: 'number' },
      },
    },
    riskFlags: {
      type: 'object',
      additionalProperties: false,
      required: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
      properties: {
        M1: {
          type: 'object',
          additionalProperties: false,
          required: ['count', 'description'],
          properties: {
            count: { type: 'number' },
            description: { type: 'array', items: { type: 'string' } },
          },
        },
        M2: {
          type: 'object',
          additionalProperties: false,
          required: ['count', 'description'],
          properties: {
            count: { type: 'number' },
            description: { type: 'array', items: { type: 'string' } },
          },
        },
        M3: {
          type: 'object',
          additionalProperties: false,
          required: ['count', 'description'],
          properties: {
            count: { type: 'number' },
            description: { type: 'array', items: { type: 'string' } },
          },
        },
        M4: {
          type: 'object',
          additionalProperties: false,
          required: ['count', 'description'],
          properties: {
            count: { type: 'number' },
            description: { type: 'array', items: { type: 'string' } },
          },
        },
        M5: {
          type: 'object',
          additionalProperties: false,
          required: ['count', 'description'],
          properties: {
            count: { type: 'number' },
            description: { type: 'array', items: { type: 'string' } },
          },
        },
        M6: {
          type: 'object',
          additionalProperties: false,
          required: ['count', 'description'],
          properties: {
            count: { type: 'number' },
            description: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    overdraftEvents: { type: ['number', 'null'] },
    overdraftDeepestNegativeBalance: { type: ['number', 'null'] },
    overdraftNegativeDays: { type: ['number', 'null'] },
    overdraftRecent: { type: 'boolean' },
    existingLoanRepayment: { type: 'number' },
    incomeClassification: { type: 'string' },
    cashFlow: {
      type: 'object',
      additionalProperties: false,
      required: ['inFlow', 'outflow'],
      properties: {
        inFlow: {
          type: 'object',
          additionalProperties: false,
          required: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
          properties: {
            M1: { type: 'number' },
            M2: { type: 'number' },
            M3: { type: 'number' },
            M4: { type: 'number' },
            M5: { type: 'number' },
            M6: { type: 'number' },
          },
        },
        outflow: {
          type: 'object',
          additionalProperties: false,
          required: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
          properties: {
            M1: { type: 'number' },
            M2: { type: 'number' },
            M3: { type: 'number' },
            M4: { type: 'number' },
            M5: { type: 'number' },
            M6: { type: 'number' },
          },
        },
      },
    },
    loanRepayment: {
      type: 'object',
      additionalProperties: false,
      required: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
      properties: {
        M1: { type: 'number' },
        M2: { type: 'number' },
        M3: { type: 'number' },
        M4: { type: 'number' },
        M5: { type: 'number' },
        M6: { type: 'number' },
      },
    },
    numberOfUniquesNegativeBalances: {
      type: 'object',
      additionalProperties: false,
      required: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
      properties: {
        M1: { type: 'number' },
        M2: { type: 'number' },
        M3: { type: 'number' },
        M4: { type: 'number' },
        M5: { type: 'number' },
        M6: { type: 'number' },
      },
    },
  },
} as const;

/**
 * Analyze bank statement data using OpenAI to extract financial information
 * @param data - Array of transaction records from bank statement
 * @returns Analysis result with extracted financial metrics
 */

export async function analyzeBankStatementRework(
  data: any[],
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<{ success: true; data: ScoringInput } | { success: false; error: string }> {
  const response = await client.responses.create({
    model: 'gpt-5.4',
    store: false,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: systemPrompt.trim(),
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text:
              'Analyze the following bank statement JSON and return the required output JSON only.\n\n' +
              JSON.stringify(keepMostRecentSixMonths(data)),
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'bank_statement_analysis',
        schema: BankStatementAnalysisResultSchema,
        strict: true,
      },
    },
  });
  const parsed = JSON.parse(response.output_text) as BankStatementAnalysisResultSchema;
  if (!parsed) {
    return {
      success: false,
      error: 'Failed to parse OpenAI response',
    };
  }
  // console.log('parsed', parsed);
  const incomes = parsed.incomeStability?.monthlyIncomes ?? [];
  const positiveIncomes = incomes.filter((x) => typeof x === 'number' && x > 0);
  parsed.incomeStability.averageIncome =
    positiveIncomes.length > 0
      ? positiveIncomes.reduce((acc, curr) => acc + curr, 0) / positiveIncomes.length
      : 0;
  return { success: true, data: parsed };
}

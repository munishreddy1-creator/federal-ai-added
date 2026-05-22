import http from 'http';

const data = JSON.stringify({ form: { product: 'Housing Loan', tenure_months: 120, cibil_score: 700, monthly_income: 100000, collateral_value: 1500000, applicant_name: 'Test' }, result: { decision: 'APPROVE', existingEMI: 0, surplus: 100000, weightedScore: 90, emiDefaultCount: 0, overdueEMICount: 0, activeOverdueAmount: 0, requestedLoanAmount: 1000000, ltv: 66, ltvCap: 75, emi: 15000, totalEMI: 15000, dti: 0.15, totalDTI: 0.15, fiorRatio: 0.15, spendToIncome: 0.3, gates: {}, finalRate: 10, nimPct: 3, maxEligibleLoan: 1500000, totalAmountPaid: 1800000, totalInterestPaid: 800000, projectedResidualIncome: 85000, maxLoanProvided: 1000000 } });

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/api/summarize',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(`BODY: ${body}`); });
});

req.on('error', (e) => { console.error(`problem with request: ${e.message}`); });
req.write(data);
req.end();

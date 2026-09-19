export const getMonthName = (month) => new Intl.DateTimeFormat('en-US', {
  month: 'long',
  timeZone: 'UTC',
}).format(new Date(Date.UTC(2020, month - 1, 1)));

export const getPaymentPeriod = (payment) => ({
  year: payment.for_year || payment.payment_date.getUTCFullYear(),
  month: payment.for_month || payment.payment_date.getUTCMonth() + 1,
});

export const getBillingStatus = (totalBill, totalPaid) => {
  if (totalBill === 0) return 'unpaid';
  if (totalPaid >= totalBill) return 'paid';
  if (totalPaid > 0) return 'partially_paid';
  return 'unpaid';
};

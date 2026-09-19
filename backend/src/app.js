import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import Client from './models/Client.js';
import Category from './models/Category.js';
import WorkEntry from './models/WorkEntry.js';
import Payment from './models/Payment.js';
import AdditionalBill from './models/AdditionalBill.js';
import { getMonthName } from './services/billingService.js';
import { errorHandler } from './middleware/errorHandler.js';
import systemRoutes from './routes/systemRoutes.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const dateOnly = (value) => new Date(`${value}T00:00:00.000Z`);
const dateString = (value) => new Date(value).toISOString().slice(0, 10);
const isValidMonth = (month) => Number.isInteger(Number(month)) && Number(month) >= 1 && Number(month) <= 12;
const isValidId = (id) => mongoose.isValidObjectId(id);
const errorMessage = (error) => error?.message || 'Request failed';

const baseFields = (document) => ({
  ...document.toObject(),
  id: document._id.toString(),
  _id: undefined,
});

const serializeClient = (document) => baseFields(document);
const serializeCategory = (document) => baseFields(document);
const serializePayment = (document) => ({
  ...baseFields(document),
  payment_date: dateString(document.payment_date),
});
const serializeAdditionalBill = (document) => ({
  ...baseFields(document),
  bill_date: dateString(document.bill_date),
});
const serializeWork = (document) => ({
  ...baseFields(document),
  work_date: dateString(document.work_date),
  client: document.client_id?.name ? { id: document.client_id._id.toString(), name: document.client_id.name } : undefined,
  category: document.category_id?.name ? { id: document.category_id._id.toString(), name: document.category_id.name } : undefined,
  client_id: document.client_id?._id?.toString() || document.client_id?.toString(),
  category_id: document.category_id?._id?.toString() || document.category_id?.toString(),
});

const notFound = (message) => Object.assign(new Error(message), { status: 404 });
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });
const conflict = (message) => Object.assign(new Error(message), { status: 409 });
const requireId = (id, label) => { if (!isValidId(id)) throw badRequest(`Invalid ${label} id`); };
const requireBody = (condition, message) => { if (!condition) throw badRequest(message); };

const getBilling = async (clientId, year, month) => {
  requireId(clientId, 'client');
  if (!isValidMonth(month)) throw badRequest('Month must be between 1 and 12');
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const client = await Client.findById(clientId);
  if (!client) throw notFound('Client not found');
  const start = dateOnly(`${numericYear}-${String(numericMonth).padStart(2, '0')}-01`);
  const end = new Date(Date.UTC(numericYear, numericMonth, 1));
  const entries = await WorkEntry.find({ client_id: clientId, status: 'completed', work_date: { $gte: start, $lt: end } }).populate('category_id');
  const additionalBills = await AdditionalBill.find({ client_id: clientId, bill_date: { $gte: start, $lt: end } }).sort({ bill_date: 1 });
  const payments = await Payment.find({ client_id: clientId, $expr: { $and: [
    { $eq: [{ $ifNull: ['$for_year', { $year: '$payment_date' }] }, numericYear] },
    { $eq: [{ $ifNull: ['$for_month', { $month: '$payment_date' }] }, numericMonth] },
  ] } }).sort({ payment_date: 1 });
  const groups = new Map();
  for (const entry of entries) {
    const category = entry.category_id;
    const key = category?._id.toString() || 'unknown';
    if (!groups.has(key)) groups.set(key, { category_id: key, category_name: category?.name || '', entries: [], entry_ids: [], count: 0, subtotal: 0 });
    const group = groups.get(key);
    group.entries.push(entry.title);
    group.entry_ids.push(entry._id.toString());
    group.count += 1;
    group.subtotal += Number(entry.rate);
  }
  const categories = [...groups.values()].sort((left, right) => left.category_name.localeCompare(right.category_name)).map((group) => ({
    ...group,
    rate_per_item: group.subtotal / group.count,
  }));
  const totalBill = categories.reduce((sum, category) => sum + category.subtotal, 0);
  const additionalTotal = additionalBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalWithAdditional = totalBill + additionalTotal;
  const balance = totalWithAdditional - totalPaid;
  return {
    client_id: clientId.toString(), client_name: client.name, year: numericYear, month: numericMonth,
    month_name: getMonthName(numericMonth), categories, total_entries: entries.length, total_bill: totalWithAdditional,
    work_total: totalBill, additional_total: additionalTotal,
    additional_bills: additionalBills.map(serializeAdditionalBill), total_paid: totalPaid, balance: Math.abs(balance), is_overpaid: balance < 0,
    payments: payments.map((payment) => ({ ...serializePayment(payment), for_month: payment.for_month || numericMonth, for_year: payment.for_year || numericYear })),
  };
};

const asyncRoute = (handler) => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);

app.use(systemRoutes);

app.get('/api/clients', asyncRoute(async (_request, response) => response.json((await Client.find().sort({ name: 1 })).map(serializeClient))));
app.post('/api/clients', asyncRoute(async (request, response) => response.status(201).json(serializeClient(await Client.create(request.body)))));
app.get('/api/clients/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'client'); const client = await Client.findById(request.params.id); if (!client) throw notFound('Client not found'); response.json(serializeClient(client)); }));
app.put('/api/clients/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'client'); const client = await Client.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true }); if (!client) throw notFound('Client not found'); response.json(serializeClient(client)); }));
app.delete('/api/clients/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'client'); if (await WorkEntry.exists({ client_id: request.params.id }) || await Payment.exists({ client_id: request.params.id }) || await AdditionalBill.exists({ client_id: request.params.id })) throw conflict('Cannot delete a client with billing records'); const client = await Client.findByIdAndDelete(request.params.id); if (!client) throw notFound('Client not found'); response.status(204).end(); }));

app.get('/api/categories', asyncRoute(async (_request, response) => response.json((await Category.find().sort({ name: 1 })).map(serializeCategory))));
app.post('/api/categories', asyncRoute(async (request, response) => { try { response.status(201).json(serializeCategory(await Category.create(request.body))); } catch (error) { if (error.code === 11000) throw badRequest('Category with this name already exists'); throw error; } }));
app.get('/api/categories/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'category'); const category = await Category.findById(request.params.id); if (!category) throw notFound('Category not found'); response.json(serializeCategory(category)); }));
app.put('/api/categories/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'category'); try { const category = await Category.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true }); if (!category) throw notFound('Category not found'); response.json(serializeCategory(category)); } catch (error) { if (error.code === 11000) throw badRequest('Category with this name already exists'); throw error; } }));
app.delete('/api/categories/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'category'); if (await WorkEntry.exists({ category_id: request.params.id })) throw conflict('Cannot delete a category with work entries'); const category = await Category.findByIdAndDelete(request.params.id); if (!category) throw notFound('Category not found'); response.status(204).end(); }));

app.get('/api/work', asyncRoute(async (request, response) => {
  const { client_id: clientId, category_id: categoryId, status, year, month, search, skip = 0, limit = 100 } = request.query;
  const filter = {};
  if (clientId) { requireId(clientId, 'client'); filter.client_id = clientId; }
  if (categoryId) { requireId(categoryId, 'category'); filter.category_id = categoryId; }
  if (status) filter.status = status;
  if (year || month) { const startMonth = month ? Number(month) : 1; const endMonth = month ? startMonth + 1 : 13; const start = dateOnly(`${year || 1970}-${String(startMonth).padStart(2, '0')}-01`); const end = year ? new Date(Date.UTC(Number(year), endMonth, 1)) : new Date('9999-12-31'); filter.work_date = { $gte: start, $lt: end }; }
  if (search) filter.title = { $regex: search, $options: 'i' };
  const entries = await WorkEntry.find(filter).populate('client_id category_id').sort({ work_date: -1 }).skip(Number(skip)).limit(Math.min(Number(limit), 500));
  response.json(entries.map(serializeWork));
}));
app.post('/api/work', asyncRoute(async (request, response) => { const body = { ...request.body, work_date: dateOnly(request.body.work_date) }; requireId(body.client_id, 'client'); requireId(body.category_id, 'category'); if (!await Client.exists({ _id: body.client_id })) throw notFound('Client not found'); const category = await Category.findById(body.category_id); if (!category) throw notFound('Category not found'); const entry = await WorkEntry.create({ ...body, rate: body.rate ?? category.default_rate }); response.status(201).json(serializeWork(await entry.populate('client_id category_id'))); }));
app.get('/api/work/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'work'); const entry = await WorkEntry.findById(request.params.id).populate('client_id category_id'); if (!entry) throw notFound('Work entry not found'); response.json(serializeWork(entry)); }));
app.put('/api/work/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'work'); const body = { ...request.body }; if (body.work_date) body.work_date = dateOnly(body.work_date); if (body.client_id) { requireId(body.client_id, 'client'); if (!await Client.exists({ _id: body.client_id })) throw notFound('Client not found'); } if (body.category_id) { requireId(body.category_id, 'category'); if (!await Category.exists({ _id: body.category_id })) throw notFound('Category not found'); } const entry = await WorkEntry.findByIdAndUpdate(request.params.id, body, { new: true, runValidators: true }).populate('client_id category_id'); if (!entry) throw notFound('Work entry not found'); response.json(serializeWork(entry)); }));
app.delete('/api/work/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'work'); if (!await WorkEntry.findByIdAndDelete(request.params.id)) throw notFound('Work entry not found'); response.status(204).end(); }));

app.get('/api/payments', asyncRoute(async (request, response) => { const { client_id: clientId, year, month } = request.query; const filter = {}; if (clientId) { requireId(clientId, 'client'); filter.client_id = clientId; } if (year || month) filter.$expr = { $and: [...(year ? [{ $eq: [{ $ifNull: ['$for_year', { $year: '$payment_date' }] }, Number(year)] }] : []), ...(month ? [{ $eq: [{ $ifNull: ['$for_month', { $month: '$payment_date' }] }, Number(month)] }] : [])] }; response.json((await Payment.find(filter).sort({ payment_date: -1 })).map(serializePayment)); }));
app.post('/api/payments', asyncRoute(async (request, response) => { const body = { ...request.body, payment_date: dateOnly(request.body.payment_date) }; requireId(body.client_id, 'client'); if (!await Client.exists({ _id: body.client_id })) throw notFound('Client not found'); body.for_month ??= new Date(body.payment_date).getUTCMonth() + 1; body.for_year ??= new Date(body.payment_date).getUTCFullYear(); response.status(201).json(serializePayment(await Payment.create(body))); }));
app.get('/api/payments/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'payment'); const payment = await Payment.findById(request.params.id); if (!payment) throw notFound('Payment not found'); response.json(serializePayment(payment)); }));
app.put('/api/payments/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'payment'); const body = { ...request.body }; if (body.payment_date) { body.payment_date = dateOnly(body.payment_date); body.for_month ??= new Date(body.payment_date).getUTCMonth() + 1; body.for_year ??= new Date(body.payment_date).getUTCFullYear(); } const payment = await Payment.findByIdAndUpdate(request.params.id, body, { new: true, runValidators: true }); if (!payment) throw notFound('Payment not found'); response.json(serializePayment(payment)); }));
app.delete('/api/payments/:id', asyncRoute(async (request, response) => { requireId(request.params.id, 'payment'); if (!await Payment.findByIdAndDelete(request.params.id)) throw notFound('Payment not found'); response.status(204).end(); }));

app.post('/api/additional-bills', asyncRoute(async (request, response) => {
  const body = { ...request.body, bill_date: dateOnly(request.body.bill_date) };
  requireId(body.client_id, 'client');
  if (!await Client.exists({ _id: body.client_id })) throw notFound('Client not found');
  response.status(201).json(serializeAdditionalBill(await AdditionalBill.create(body)));
}));
app.put('/api/additional-bills/:id', asyncRoute(async (request, response) => {
  requireId(request.params.id, 'additional bill');
  const body = { ...request.body };
  if (body.bill_date) body.bill_date = dateOnly(body.bill_date);
  const bill = await AdditionalBill.findByIdAndUpdate(request.params.id, body, { new: true, runValidators: true });
  if (!bill) throw notFound('Additional bill not found');
  response.json(serializeAdditionalBill(bill));
}));
app.delete('/api/additional-bills/:id', asyncRoute(async (request, response) => {
  requireId(request.params.id, 'additional bill');
  if (!await AdditionalBill.findByIdAndDelete(request.params.id)) throw notFound('Additional bill not found');
  response.status(204).end();
}));
app.delete('/api/billing/:clientId/:year/:month', asyncRoute(async (request, response) => {
  requireId(request.params.clientId, 'client');
  if (!isValidMonth(request.params.month)) throw badRequest('Month must be between 1 and 12');
  const year = Number(request.params.year);
  const month = Number(request.params.month);
  const start = dateOnly(`${year}-${String(month).padStart(2, '0')}-01`);
  const end = new Date(Date.UTC(year, month, 1));
  await Promise.all([
    WorkEntry.deleteMany({ client_id: request.params.clientId, status: 'completed', work_date: { $gte: start, $lt: end } }),
    AdditionalBill.deleteMany({ client_id: request.params.clientId, bill_date: { $gte: start, $lt: end } }),
  ]);
  response.status(204).end();
}));
const noopAdditionalHistory = ((async () => {
  const [workMonths, paymentMonths, additionalMonths] = await Promise.all([WorkEntry.find({ client_id: request.params.clientId, status: 'completed' }).select('work_date'), Payment.find({ client_id: request.params.clientId }).select('payment_date for_year for_month'), AdditionalBill.find({ client_id: request.params.clientId }).select('bill_date')]); const months = new Set(); workMonths.forEach((entry) => months.add(`${entry.work_date.getUTCFullYear()}-${entry.work_date.getUTCMonth() + 1}`)); paymentMonths.forEach((payment) => months.add(`${payment.for_year || payment.payment_date.getUTCFullYear()}-${payment.for_month || payment.payment_date.getUTCFullYear()}`)); additionalMonths.forEach((bill) => months.add(`${bill.bill_date.getUTCFullYear()}-${bill.bill_date.getUTCMonth() + 1}`)); const summaries = []; for (const value of [...months].sort((a, b) => b.localeCompare(a))) { const [year, month] = value.split('-').map(Number); const billing = await getBilling(request.params.clientId, year, month); const status = billing.total_bill === 0 ? 'unpaid' : billing.total_paid >= billing.total_bill ? 'paid' : billing.total_paid > 0 ? 'partially_paid' : 'unpaid'; summaries.push({ year, month, month_name: billing.month_name, total_entries: billing.total_entries, total_bill: billing.total_bill, total_paid: billing.total_paid, balance: billing.balance, status }); } response.json(summaries); }));

app.get('/api/billing/:clientId/:year/:month', asyncRoute(async (request, response) => response.json(await getBilling(request.params.clientId, request.params.year, request.params.month))));
app.get('/api/billing/:clientId/history', asyncRoute(async (request, response) => { requireId(request.params.clientId, 'client'); const client = await Client.exists({ _id: request.params.clientId }); if (!client) return response.json([]); const [workMonths, paymentMonths] = await Promise.all([WorkEntry.find({ client_id: request.params.clientId, status: 'completed' }).select('work_date'), Payment.find({ client_id: request.params.clientId }).select('payment_date for_year for_month')]); const months = new Set(); workMonths.forEach((entry) => months.add(`${entry.work_date.getUTCFullYear()}-${entry.work_date.getUTCMonth() + 1}`)); paymentMonths.forEach((payment) => months.add(`${payment.for_year || payment.payment_date.getUTCFullYear()}-${payment.for_month || payment.payment_date.getUTCMonth() + 1}`)); const summaries = []; for (const value of [...months].sort((a, b) => b.localeCompare(a))) { const [year, month] = value.split('-').map(Number); const billing = await getBilling(request.params.clientId, year, month); const status = billing.total_bill === 0 ? 'unpaid' : billing.total_paid >= billing.total_bill ? 'paid' : billing.total_paid > 0 ? 'partially_paid' : 'unpaid'; summaries.push({ year, month, month_name: billing.month_name, total_entries: billing.total_entries, total_bill: billing.total_bill, total_paid: billing.total_paid, balance: billing.balance, status }); } response.json(summaries); }));
app.get('/api/dashboard/:clientId/:year/:month', asyncRoute(async (request, response) => { const billing = await getBilling(request.params.clientId, request.params.year, request.params.month); const start = dateOnly(`${request.params.year}-${String(request.params.month).padStart(2, '0')}-01`); const end = new Date(Date.UTC(Number(request.params.year), Number(request.params.month), 1)); const recent = await WorkEntry.find({ client_id: request.params.clientId, work_date: { $gte: start, $lt: end } }).populate('category_id').sort({ work_date: -1 }).limit(10); response.json({ client_id: billing.client_id, client_name: billing.client_name, year: billing.year, month: billing.month, month_name: billing.month_name, total_videos: billing.total_entries, total_bill: billing.total_bill, amount_paid: billing.total_paid, amount_remaining: billing.balance, is_overpaid: billing.is_overpaid, categories: billing.categories, recent_work: recent.map((entry) => ({ id: entry._id.toString(), title: entry.title, work_date: dateString(entry.work_date), category_name: entry.category_id?.name || '', rate: entry.rate, status: entry.status })) }); }));

app.use(errorHandler);

export { Client, Category, WorkEntry, Payment, getBilling };
export default app;
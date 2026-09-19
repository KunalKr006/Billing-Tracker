export const errorHandler = (error, _request, response, _next) => {
  const status = error.status || (error.name === 'ValidationError' ? 422 : 500);
  response.status(status).json({ detail: error.message || 'Request failed' });
};

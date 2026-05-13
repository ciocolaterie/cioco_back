export const notFound = (req, res, next) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} nu există` });
};

export const errorHandler = (err, req, res, next) => {
  console.error('❌', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Eroare server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Wrapper pentru async handlers — prinde erori automat
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

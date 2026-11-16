export const sendSuccess = (res, payload = {}, status = 200) =>
  {
    const requestId = res.locals?.requestId;
    return res.status(status).json({
      success: true,
      ...(requestId ? { requestId } : {}),
      ...payload,
    });
  };

export const sendError = (
  res,
  {
    status = 500,
    code = "INTERNAL_SERVER_ERROR",
    message = "Something went wrong",
    field,
    details,
  } = {}
) => {
  const requestId = res.locals?.requestId;
  return res.status(status).json({
    success: false,
    ...(requestId ? { requestId } : {}),
    message,
    error: {
      code,
      message,
      ...(field ? { field } : {}),
      ...(details ? { details } : {}),
    },
  });
};

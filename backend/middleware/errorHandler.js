// import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode ;
  constructor(message , statusCode ) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err ,
  req ,
  res ,
  next ,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Handle Prisma known errors
  const prismaErr = err ;
  if (prismaErr?.code === "P2002") {
    return res.status(409).json({ success: false, error: "A record with that value already exists." });
  }
  if (prismaErr?.code === "P2025") {
    return res.status(404).json({ success: false, error: "Record not found." });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, error: "Internal server error" });
};

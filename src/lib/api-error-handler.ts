import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ERROR_MESSAGES, formatPrismaError } from "./error-messages";

/**
 * ═══════════════════════════════════════════════════════════════
 * STANDARDIZED API ERROR HANDLER
 * ═══════════════════════════════════════════════════════════════
 */

export enum ErrorCode {
  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export class ApiError extends Error {
  constructor(
    public statusCode: ErrorCode,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Handle errors and return standardized NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("[API ERROR]", error);

  // ApiError - Custom application errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Prisma Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const message = formatPrismaError(error);
    const statusCode = getPrismaErrorStatusCode(error.code);

    return NextResponse.json(
      {
        error: message,
        code: error.code,
      },
      { status: statusCode }
    );
  }

  // Prisma Validation Error
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: ERROR_MESSAGES.VALIDATION.INVALID_FORMAT("Dữ liệu"),
      },
      { status: ErrorCode.UNPROCESSABLE_ENTITY }
    );
  }

  // Generic Error
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: ErrorCode.INTERNAL_SERVER_ERROR }
    );
  }

  // Unknown error
  return NextResponse.json(
    {
      error: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
    },
    { status: ErrorCode.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Map Prisma error codes to HTTP status codes
 */
function getPrismaErrorStatusCode(code: string): ErrorCode {
  switch (code) {
    case "P2002": // Unique constraint
      return ErrorCode.CONFLICT;

    case "P2025": // Not found
      return ErrorCode.NOT_FOUND;

    case "P2003": // Foreign key constraint
    case "P2014": // Relation violation
      return ErrorCode.UNPROCESSABLE_ENTITY;

    case "P2000": // Value out of range
      return ErrorCode.BAD_REQUEST;

    default:
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Throw standardized errors
 */
export const throwError = {
  unauthenticated: () => {
    throw new ApiError(
      ErrorCode.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.UNAUTHENTICATED
    );
  },

  unauthorized: () => {
    throw new ApiError(ErrorCode.FORBIDDEN, ERROR_MESSAGES.AUTH.UNAUTHORIZED);
  },

  notFound: (resource: string = "Dữ liệu") => {
    throw new ApiError(
      ErrorCode.NOT_FOUND,
      `Không tìm thấy ${resource.toLowerCase()}`
    );
  },

  badRequest: (message: string) => {
    throw new ApiError(ErrorCode.BAD_REQUEST, message);
  },

  conflict: (message: string) => {
    throw new ApiError(ErrorCode.CONFLICT, message);
  },

  validation: (field: string, reason: string) => {
    throw new ApiError(
      ErrorCode.UNPROCESSABLE_ENTITY,
      ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD(field),
      { field, reason }
    );
  },
};

/**
 * Validation helpers
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw new ApiError(
      ErrorCode.BAD_REQUEST,
      `Thiếu thông tin: ${missing.join(", ")}`,
      { missingFields: missing }
    );
  }
}

export function validatePositiveNumber(value: any, field: string): void {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new ApiError(
      ErrorCode.BAD_REQUEST,
      ERROR_MESSAGES.VALIDATION.MIN_VALUE(field, 1)
    );
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(
      ErrorCode.BAD_REQUEST,
      ERROR_MESSAGES.VALIDATION.INVALID_EMAIL
    );
  }
}

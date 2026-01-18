package com.Ghallab.dev.Test_Scanner_backend.shared.exception;

/**
 * Base exception for API errors
 */
public class ApiException extends RuntimeException {
    private final String errorCode;
    private final int statusCode;

    public ApiException(String message, String errorCode, int statusCode) {
        super(message);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }

    public ApiException(String message, Throwable cause, String errorCode, int statusCode) {
        super(message, cause);
        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}


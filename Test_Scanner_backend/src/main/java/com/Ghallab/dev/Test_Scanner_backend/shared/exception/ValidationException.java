package com.Ghallab.dev.Test_Scanner_backend.shared.exception;

/**
 * Exception thrown when validation fails
 */
public class ValidationException extends ApiException {
    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", 400);
    }

    public ValidationException(String field, String message) {
        super("Validation error on field '" + field + "': " + message, "VALIDATION_ERROR", 400);
    }
}


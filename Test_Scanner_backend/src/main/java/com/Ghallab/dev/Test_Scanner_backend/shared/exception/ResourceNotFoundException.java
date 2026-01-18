package com.Ghallab.dev.Test_Scanner_backend.shared.exception;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String message) {
        super(message, "RESOURCE_NOT_FOUND", 404);
    }

    public ResourceNotFoundException(String resourceName, java.util.UUID id) {
        super(resourceName + " with id " + id + " not found", "RESOURCE_NOT_FOUND", 404);
    }

    public ResourceNotFoundException(String resourceName, String identifier) {
        super(resourceName + " with identifier " + identifier + " not found", "RESOURCE_NOT_FOUND", 404);
    }
}


package com.Ghallab.dev.Test_Scanner_backend.common.exceptions;

public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}

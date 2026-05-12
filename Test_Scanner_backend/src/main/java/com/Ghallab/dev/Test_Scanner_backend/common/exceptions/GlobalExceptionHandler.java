package com.Ghallab.dev.Test_Scanner_backend.common.exceptions;


import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Response<?>> handleAllUnkownException(Exception ex){
        Response<?> response = Response.builder().
                statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(response , HttpStatus.INTERNAL_SERVER_ERROR)  ;
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Response<?>> handleNotFoundException( NotFoundException ex){
        Response<?> response = Response.builder().
                statusCode(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(response , HttpStatus.NOT_FOUND)  ;
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Response<?>> handleBadRequestException( BadRequestException ex){
        Response<?> response = Response.builder().
                statusCode(HttpStatus.BAD_REQUEST.value())
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(response , HttpStatus.BAD_REQUEST)  ;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Response<?>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getDefaultMessage() == null ? error.getField() : error.getDefaultMessage())
                .collect(Collectors.joining(". "));

        Response<?> response = Response.builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .message(message.isBlank() ? "Validation failed" : message)
                .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Response<?>> handleTooManyRequestsException(TooManyRequestsException ex) {
        Response<?> response = Response.builder()
                .statusCode(HttpStatus.TOO_MANY_REQUESTS.value())
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(response, HttpStatus.TOO_MANY_REQUESTS);
    }
}






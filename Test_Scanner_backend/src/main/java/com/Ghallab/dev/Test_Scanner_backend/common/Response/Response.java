package com.Ghallab.dev.Test_Scanner_backend.common.Response;


import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Response<T> {
    private T data;
    private String message;
    private boolean success;
    private int statusCode;

    public static <T> Response<T> success(T data, String message) {
        return Response.<T>builder()
                .data(data)
                .message(message)
                .success(true)
                .statusCode(200)
                .build();
    }

    public static <T> Response<T> success(T data) {
        return Response.<T>builder()
                .data(data)
                .message("Success")
                .success(true)
                .statusCode(200)
                .build();
    }

    public static <T> Response<T> error(String message) {
        return Response.<T>builder()
                .message(message)
                .success(false)
                .statusCode(400)
                .build();
    }

    public static <T> Response<T> error(String message, int code) {
        return Response.<T>builder()
                .message(message)
                .success(false)
                .statusCode(code)
                .build();
    }
}
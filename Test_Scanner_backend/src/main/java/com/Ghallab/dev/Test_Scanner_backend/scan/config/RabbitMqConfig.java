package com.Ghallab.dev.Test_Scanner_backend.scan.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Qualifier;

@Configuration
public class RabbitMqConfig {

    @Bean
    public TopicExchange scanExchange(ScanMessagingProperties properties) {
        return new TopicExchange(properties.exchange(), true, false);
    }

    @Bean
    public Queue scanRequestQueue(ScanMessagingProperties properties) {
        return new Queue(properties.requestQueue(), true);
    }

    @Bean
    public Queue scanResultQueue(ScanMessagingProperties properties) {
        return new Queue(properties.resultQueue(), true);
    }

    @Bean
    public Binding scanRequestBinding(
            @Qualifier("scanRequestQueue") Queue scanRequestQueue,
            TopicExchange scanExchange,
            ScanMessagingProperties properties
    ) {
        return BindingBuilder
                .bind(scanRequestQueue)
                .to(scanExchange)
                .with(properties.routingKey());
    }

    @Bean
    public Binding scanResultBinding(
            @Qualifier("scanResultQueue") Queue scanResultQueue,
            TopicExchange scanExchange,
            ScanMessagingProperties properties
    ) {
        return BindingBuilder
                .bind(scanResultQueue)
                .to(scanExchange)
                .with(properties.resultRoutingKey());
    }

    @Bean
    public MessageConverter rabbitMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}

package com.Ghallab.dev.Test_Scanner_backend.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

@Configuration
public class AppConfig {
    @Bean
    public SpringTemplateEngine templateEngine(){
        SpringTemplateEngine templateEngine = new SpringTemplateEngine() ;
        ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
        templateResolver.setPrefix("templates/");
        templateResolver.setSuffix(".html");
        templateResolver.setCharacterEncoding("Utf-8");
        templateEngine.setTemplateResolver(templateResolver);

        return templateEngine ;
    }

    @Bean
    public ModelMapper modelMapperConfig() {
        ModelMapper modelMapper = new ModelMapper() ;
        modelMapper.getConfiguration()
                .setFieldMatchingEnabled(true)
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE)
                .setMatchingStrategy(MatchingStrategies.STANDARD)
                .setAmbiguityIgnored(true);  // ← Игнорируем неоднозначности

        // ✅ Конфигурация для CreateAnswerKeyRequest -> AnswerKey (Entity creation only)
        // Пропускаем системные поля которые управляются Hibernate
        modelMapper.typeMap(
                com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateAnswerKeyRequest.class,
                com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey.class
        )
        .addMappings(mapper -> {
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey::setId);
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey::setVersion);
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey::setCreatedAt);
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.AnswerKey::setUpdatedAt);
        });

        // ✅ Конфигурация для CreateGradeThresholdRequest -> GradeThreshold (Entity creation only)
        // Пропускаем системные поля которые управляются Hibernate
        modelMapper.typeMap(
                com.Ghallab.dev.Test_Scanner_backend.test.dto.CreateGradeThresholdRequest.class,
                com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold.class
        )
        .addMappings(mapper -> {
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold::setId);
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold::setVersion);
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold::setCreatedAt);
            mapper.skip(com.Ghallab.dev.Test_Scanner_backend.test.domain.entity.GradeThreshold::setUpdatedAt);
        });

        // ✅ Для остальных Entity -> DTO маппингов используем РУЧНОЕ МАППИНГ в Mapper классах!
        // Это обеспечивает полный контроль над маппингом и избегает ошибок с complex relationships

        return modelMapper ;
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}


package org.team4p.woorizip.common.validator;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NumericValidator.class)
public @interface TextOnly {
	String message() default "한글과 영문자만 입력 가능합니다.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

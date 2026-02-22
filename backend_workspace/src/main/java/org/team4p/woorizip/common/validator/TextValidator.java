package org.team4p.woorizip.common.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TextValidator implements ConstraintValidator<TextOnly, String> {
	@Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isBlank()) return true;
        return value.matches("^[가-힣a-zA-Z\\s]+$");
    }
}

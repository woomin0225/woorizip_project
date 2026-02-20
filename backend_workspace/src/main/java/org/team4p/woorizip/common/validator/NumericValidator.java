package org.team4p.woorizip.common.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NumericValidator implements ConstraintValidator<NumericOnly, String> {
	@Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) return false;
        return value.matches("^[0-9]+$");
    }
}

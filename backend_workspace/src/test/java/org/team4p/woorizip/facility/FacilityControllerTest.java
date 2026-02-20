package org.team4p.woorizip.facility;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.team4p.woorizip.common.validator.NumericValidator;
import org.team4p.woorizip.common.validator.TextValidator;
import org.team4p.woorizip.facility.controller.FacilityController;
import org.team4p.woorizip.facility.service.FacilityService;

@WebMvcTest(FacilityController.class)
@Import({TextValidator.class, NumericValidator.class})
class FacilityControllerTest {
	
	@Autowired
	private MockMvc mockMvc;
	
	@MockitoBean
	private FacilityService facilityService;
	
	@Test
	@WithMockUser
	void test() throws Exception {
		// Validator Test
		when(facilityService.createFacility(any(), any()))
	    .thenReturn("테스트 성공");
		
		String wrongJson = "{\"facilityName\": \"시설123\", \"facilityAddress\": \"서울\"}";

        mockMvc.perform(post("/api/facilities")
        		.with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(wrongJson))
                .andExpect(status().isBadRequest())
                .andDo(print());
	}

}

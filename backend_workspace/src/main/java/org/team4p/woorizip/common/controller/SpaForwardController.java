package org.team4p.woorizip.common.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaForwardController {
	@RequestMapping(value = {
		      "/{path:^(?!api|auth|oauth2).*$}",
		      "/**/{path:^(?!api|auth|oauth2).*$}"
		  })
		  public String forward() {
		    return "forward:/index.html";
		  }
}

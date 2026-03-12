package org.team4p.woorizip.common.controller;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnResource;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@ConditionalOnProperty(name = "app.spa.forward-enabled", havingValue = "true")
@ConditionalOnResource(resources = "classpath:/static/index.html")
public class SpaForwardController {

    @RequestMapping(value = {
            "/",
            "/{path:[^\\.]*}",
            "/**/{path:[^\\.]*}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
package com.Ghallab.dev.Test_Scanner_backend.site.service;

import com.Ghallab.dev.Test_Scanner_backend.common.Response.Response;
import com.Ghallab.dev.Test_Scanner_backend.site.dto.SiteContactRequest;

public interface SiteContactService {

    Response<String> sendContactMessage(SiteContactRequest request);
}

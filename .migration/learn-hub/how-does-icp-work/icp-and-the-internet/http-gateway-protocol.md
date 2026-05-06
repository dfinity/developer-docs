---
learn_hub_id: 34211943471892
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34211943471892-HTTP-Gateway-Protocol"
learn_hub_title: "HTTP Gateway Protocol"
learn_hub_section: "ICP and the Internet"
learn_hub_category: "How does ICP work?"
migrated: false
---

# HTTP Gateway Protocol

The [HTTP Gateway Protocol](https://internetcomputer.org/docs/current/references/http-gateway-protocol-spec) translates HTTP requests coming from a client (e.g., your browser) into API canister calls and then the responses back into HTTP responses.

In the following, we describe the life of an HTTP request to a canister until it is turned into the corresponding HTTP response. This involves four components:

  1. The client, which makes the HTTP request (e.g., a browser);
  2. An HTTP gateway, which translates the HTTP request into an API canister call and the resulting response into an HTTP response;
  3. An API boundary node, which routes the API canister call to a replica of the subnet hosting the target canister;
  4. A canister, which implements the HTTP interface.



![](https://learn.internetcomputer.org/hc/article_attachments/34717980895636)

_HTTP Gateway converts the format of HTTP Requests to canister API calls, and the resulting responses back to HTTP responses._

_  
_So let’s look at what happens when one opens a website that is hosted in a canister, e.g.,[ www.internetcomputer.org](https://internetcomputer.org/).

It all starts in the browser. The browser does not know that this site is hosted on the Internet Computer and makes a normal HTTP request, just as it would for any other site. It sends that request to the server hosting internetcomputer.org, which is running the HTTP gateway protocol.

This server takes the HTTP request and translates it into an API canister call. In particular, it turns the HTTP request into a query call to the http_request-method of the target canister and puts the requested path, the HTTP request headers and the body into the payload of that query call. How this works in detail is explained in the[ HTTP gateway protocol specification](https://internetcomputer.org/docs/current/references/http-gateway-protocol-spec). Today, there exists one main implementation of the HTTP gateway protocol: the ic-http-gateway library, which is, for example, used in the HTTP gateways.

The API boundary node simply takes the API canister call and forwards it to a replica node, which is part of the subnet that hosts the target canister.

The canister receives that query call for its http_request-method, processes it and replies. To this end, the canister needs to implement the[ Canister HTTP Interface](https://internetcomputer.org/docs/current/references/http-gateway-protocol-spec#canister-http-interface), which is part of the HTTP gateway protocol.

The HTTP gateway receives the response from the canister and translates it back to an HTTP response. It unpacks the response, takes the status code, the supplied headers, the body, etc. and constructs an HTTP response from that. In addition to constructing the response, the HTTP gateway also verifies that the response is correct and has not been tampered with by a malicious replica node. To this end, each response comes with a certificate from the entire subnet (for more details check[ asset certification](https://learn.internetcomputer.org/hc/en-us/articles/34276431179412)).

Finally, the browser receives the HTTP response and displays the site.

## **Additional information**

[Ic-http-gateway Library](https://github.com/dfinity/http-gateway/tree/main/packages/ic-http-gateway)

[Response-verification](https://github.com/dfinity/response-verification): a collection of libraries to help canister developers with certifying their responses to work with the HTTP gateway protocol


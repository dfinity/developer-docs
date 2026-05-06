---
learn_hub_id: 34212818609684
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34212818609684-ICP-Edge-Infrastructure"
learn_hub_title: "ICP Edge Infrastructure"
learn_hub_section: "ICP and the Internet"
learn_hub_category: "How does ICP work?"
migrated: false
---

# ICP Edge Infrastructure

The edge infrastructure of the Internet Computer consists of two key components: API boundary nodes and HTTP gateways. These components work together to enable seamless communication between users and the Internet Computer while ensuring scalability, security, and efficient request processing.

![](https://learn.internetcomputer.org/hc/article_attachments/34717950444948)

**API Boundary Nodes:** API boundary nodes serve as the primary interface for interacting with the Internet Computer. They handle IC API requests—such as query and update calls—and efficiently route them to nodes (replica in the figure above) of the appropriate subnet. 

**HTTP Gateways:** HTTP gateways act as a translation layer between traditional HTTP and ICP communication, allowing direct browser access to canisters hosted on the Internet Computer.   
  


This split design provides flexibility for future expansions, enabling the integration of additional gateways that bridge between ICP and other established protocols such as DNS and SMTP. 

## API Boundary Nodes

API boundary nodes are the globally distributed public interface of the Internet Computer. They receive requests from clients and efficiently route them to nodes of the appropriate subnet. This ensures seamless communication between IC-native applications and the decentralized network without reliance on centralized infrastructure.

**Beyond Simple Routing**

While their primary role is to deliver IC API requests (e.g., query and update calls), API boundary nodes perform several additional critical functions:

  * **Dynamic Routing** : Continuously monitor the Internet Computer core and adapt accordingly.
  * **Load Balancing** : Distribute traffic efficiently to optimize performance.
  * **Caching** : Store some responses temporarily to reduce latency and improve user experience.
  * **Security Enforcement** : Implement safeguards to protect both themselves and the IC core from potential threats.



**Fully Decentralized and NNS-Managed**

API boundary nodes are an integral part of the Internet Computer, managed entirely by the [Network Nervous System (NNS)](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236). Any additions, removals, or upgrades require an NNS proposal, ensuring transparency and decentralization. These nodes operate on hardware owned by multiple independent node providers, similar to the replica nodes assigned to subnets.

**Unified Deployment**

API boundary nodes run a service called ic-boundary. The Internet Computer utilizes a single virtual machine (VM) image for both replica and API boundary nodes. The orchestrator component on each node determines the node’s role, launching either ic-replica (for replica nodes) or ic-boundary (for API boundary nodes).

**Global Deployment**

Currently, around 20 API boundary nodes are deployed worldwide, ensuring a resilient and performant network. An up-to-date list of the API boundary nodes is available on the [dashboard](https://dashboard.internetcomputer.org/nodes?s=100&type=ApiBoundary).

## HTTP Gateways

HTTP gateways add an extra layer to the Internet Computer, translating HTTP requests into IC API calls and forwarding them to the API boundary nodes. Thanks to these gateways, browsers and other HTTP-speaking clients can directly interact with canisters on the Internet Computer. This is why, for example, you can access the Internet Computer website, [internetcomputer.org](http://internetcomputer.org/), from a browser without the need for any additional software, even though the site is fully hosted onchain.

The translation of HTTP to IC API calls and back is defined in the [HTTP Gateway Protocol](https://learn.internetcomputer.org/hc/en-us/articles/34211943471892).

Since HTTP gateways act as a translation layer, they are not part of ICP and can be deployed and operated by anyone. This open model encourages a diverse set of gateways, enhancing redundancy and availability.


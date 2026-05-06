---
learn_hub_id: 33152818663444
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/33152818663444-What-is-ICP"
learn_hub_title: "What is ICP?"
learn_hub_section: "Overview"
learn_hub_category: "What is ICP?"
migrated: false
---

# What is ICP?

ICP, the Internet Computer Protocol, is the protocol that underlies the Internet Computer. The Internet Computer extends the Internet by enabling anyone to install and run software on the network. The software running on top of ICP includes anything from social media, enterprise applications, or personal websites to new AI applications such as chat bots. In contrast to centralized cloud platforms, the Internet Computer Protocol is decentralized, which means that it runs on many node machines that are distributed around the world and maintained by independent node providers.

## Why ICP rather than traditional Backend IT & cloud providers?

The decentralization of ICP provides the following key advantages compared to traditional backend IT and cloud providers.

  1. **User-owned applications and data:** Users can control applications, including how they evolve and what happens to the data. For such applications, no single party can unilaterally change the application or the users' data. This is enabled by ICP's built-in access control determining not only who has access to data but also who can change an application.
  2. **Tamperproof:** ICP provably guarantees the integrity of the protocol and applications running on it, even if some node machines are malicious.
  3. **Verifiable:** Applications run on ICP can be fully verifiable so that users know what code they interact with and what happens to their assets and data. For verifiability, the results generated on the platform are jointly signed by the nodes using a protocol. This guarantees that as long as enough of the node machines are honest, anyone interacting with an application on ICP can check that the result is what it should be and no one can have changed it.
  4. **Robustness and Availability:** ICP is resilient against machines that are faulty or unavailable, for example due to bugs or catastrophic events that cause outages or destroy data centers. It remains available even if some providers of node machines decide to stop supporting the platform. This is achieved as ICP is run by many independent parties distributed all over the globe and because these nodes run a fault-tolerant decentralized protocol. This means that the protocol cryptographically ensures integrity of the programs and data as long as a large enough portion (more than two thirds) of the participating nodes are honest.



All these properties and the mechanisms that achieve them are explained in detail in the section [How Does the Internet Computer Work](https://learn.internetcomputer.org/hc/en-us/articles/33694833025172). Together, they realize the [web3](https://en.wikipedia.org/wiki/Web3) vision of an Internet which empowers users with full ownership and control over their online experiences.

#### Example: Chat application

To illustrate the above properties, let us consider a chat application. Assume for example, that you are the creator of such an application. If the application is hosted on a single server, then the server could be destroyed due to a storm and the application would not be available to users. If the application is hosted on a cloud provider, usually the cloud provider would ensure that there is some redundancy over different machines and robustness is provided. However, this cloud provider is a single entity that must be trusted: if the cloud provider does not protect the servers, decides to turn them off or restricts access to them for people from certain regions (due to changes in business strategy or regulation), the chat application is not working properly - users from some regions might all of a sudden be unreachable. In contrast, if the chat application is deployed on ICP, there is no single party that must be trusted. ICP is built such that it can tolerate buggy or misbehaving machines and parties. Therefore, ICP seamlessly provides availability and is tamperproof.

ICP also adds another element that protects the users and ensures that they can fully verify the programs or applications that they are interacting with. Let's again take the chat app as an example. To convince the users that the chat app is implemented well and does not have any bugs or even malicious backdoors to read along with messages or modify them, the developer can open source the code of the app. However, even if users carefully inspect the code, they often have no way of verifying that the application that they interact with is in fact running the code that they have checked. ICP provides this property and ensures that users can verify that a program they interact with is the one that was compiled from a given code. This can even be taken a step further by Open Internet Services that allow users to co-own an application and collectively decide whether and how it is changed. This means that the users of the chat app cannot only decide how the app's functionality is evolved but also have full control over the messages and pictures that they have sent around. This facilitates a more open and inclusive Internet.

## Why ICP rather than another blockchain?

The Internet Computer Protocol is a blockchain-based protocol. Compared to other blockchains, ICP has the following advantages.

  * **Users' full ownership of code and data:** ICP is able to host entire general-purpose applications, including all data and the frontend components. Together with the built-in access control, this ensures that entire applications with all their components and data can be fully owned and controlled by users.
  * **Seamless user experience:** For interacting with applications on blockchains, users often need to have special accounts and pay for certain interactions. In contrast, users can interact with applications and websites running on ICP in the same way as they interact with traditional applications and websites (on traditional infrastructure). They can read a website in their browser and don’t need to install any special software or extensions to do so.
  * **Flexible integration with existing infrastructure and other chains:** ICP enables applications to interact with existing infrastructure, such as websites and tools, through standard Internet protocols. Moreover, applications can also interact with other blockchains. This means that developers are not locked into one platform and can build on components that already exist.
  * **Flexibility in programming language:** Developers can build applications using different programming languages. This includes Motoko, which is a language built specifically for ICP and designed to make ICP features easily accessible. It is also possible to use existing languages such as Rust, Python, or Typescript, which ensures a low entry barrier for experienced developers moving to ICP from another platform. 



Users can interact with applications on ICP seamlessly because end-users do not need to directly pay for their activity and because the performance is comparable to traditional infrastructure. Applications can be hosted fully on ICP due to the low cost for compute and storage and due to the fact that ICP is scalable and can provide more infrastructure when needed. Another important factor is that, in contrast to other blockchains, ICP supports upgrading applications while keeping their data in a verifiable way, which is needed to evolve applications with changing user needs. The applications that are deployed on ICP can be written in different languages, as they are deployed in a format called WebAssembly, which many other languages can be compiled to.


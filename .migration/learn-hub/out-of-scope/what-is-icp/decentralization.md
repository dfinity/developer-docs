---
learn_hub_id: 44009922536852
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/44009922536852-Decentralization"
learn_hub_title: "Decentralization"
learn_hub_section: "Decentralization"
learn_hub_category: "What is ICP?"
migrated: false
---

# Decentralization

In the context of blockchains, “decentralization” [is defined by Wikipedia](https://en.wikipedia.org/wiki/Decentralization#Blockchain_technology) as:

_“Decentralization [in blockchains] refers to the transfer of control and decision-making from a centralized entity (individual, organization, or group thereof) to a distributed network. Decentralized networks strive to reduce the level of trust that participants must place in one another, and deter their ability to exert authority or control over one another in ways that degrade the functionality of the network.”_

All blockchains rely on a consensus protocol to come to agreement on the state of the network. The higher the decentralization of a network, the more individual actors need to coordinate to come to an agreement. In a centralized or low-decentralization system, one or a handful of entities would be sufficient to establish the state of the system. 

Vitalik Buterin [described decentralization](https://medium.com/@VitalikButerin/the-meaning-of-decentralization-a0c92b76a274) along three independent axes:

  1. **Architectural (de)centralization** — how many physical computers is a system made up of? How many of those computers can it tolerate breaking down at any single time?
  2. **Political (de)centralization** — how many individuals or organizations ultimately control the computers that the system is made up of?
  3. **Logical (de)centralization** — does the interface and data structures that the system presents and maintains look more like a single monolithic object, or an amorphous swarm? One simple heuristic is: if you cut the system in half, including both providers and users, will both halves continue to fully operate as independent units?”



Buterin described blockchains as being **architecturally decentralized** (many computers), **politically decentralized** (many entities), but **logically centralized** (one commonly agreed state).

This article focuses on the architectural and political decentralization of ICP.

## Why Decentralization Matters

Decentralization is key to making web3 dapps run in a trustless manner. Vitalik Buterin broke it down into three core benefits one gets from decentralized computer networks like blockchains:

  1. **Fault tolerance** — decentralized systems are less likely to fail accidentally because they rely on many separate components that are not likely.
  2. **Attack resistance** — decentralized systems are more expensive to attack and destroy or manipulate because they lack sensitive central points that can be attacked at much lower cost than the economic size of the surrounding system.
  3. **Collusion resistance** — it is much harder for participants in decentralized systems to collude to act in ways that benefit them at the expense of other participants, whereas the leaderships of corporations and governments collude in ways that benefit themselves but harm less well-coordinated citizens, customers, employees and the general public all the time.



For token holders, smart contract developers, or dapp users this means a more decentralized network would be:

  * More resilient to computer or systems faults
  * More resilient to attacks by malicious actors
  * More resistant to collusion by entities within the network to harm the network



## Measuring Decentralization

To help measure and improve decentralization, a common index used in the blockchain world is the [Nakamoto Coefficient](https://news.earn.com/quantifying-decentralization-e39db233c28e):

_“The basic idea is to (a) enumerate the**essential subsystems** of a decentralized system, (b) determine how many entities one would need to collude or be compromised to control each subsystem, and (c) then use the minimum of these as a measure of the effective decentralization of the system. The higher the value of this minimum Nakamoto coefficient, the more decentralized the system is.”_

In practice, determining the NC (Nakamoto Coefficient) to particular chains is more art than science, but it helps provide a good way to identify bottlenecks, the growth or decentralization within a blockchain. Please note: comparing NCs across blockchains can be very imprecise and akin to comparing “apples to oranges.”

To measure decentralization, a common pattern in blockchains is:

  1. Identify the subsystems of a blockchain
  2. For each subsystem, determine the subsystem’s NC (the # of entities necessary to compromise to control it)
  3. The subsystem with the  _minimum_ NC represents the best holistic measure of decentralization



  
  



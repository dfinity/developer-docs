---
learn_hub_id: 46135518360212
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/46135518360212-Overview"
learn_hub_title: "Overview"
learn_hub_section: "Node Infrastructure"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Overview

IC-OS is the operating system that runs on Internet Computer nodes. It's based on Ubuntu Linux and customized specifically for the IC.

IC-OS is actually three different operating systems that work together, each with a specific job.

### SetupOS

**SetupOS** is used when setting up a new node for the first time. Node providers download the SetupOS onto a USB drive, plug it into their node machine and boot from it. The SetupOS automatically sets everything up and then the machine reboots into the HostOS.

**What it does:**

  * Checks that the hardware meets requirements
  * Tests network connectivity
  * Installs the other two operating systems (HostOS and GuestOS)
  * Sets up the node with necessary settings and security keys



### HostOS

**HostOS** runs directly on the physical hardware. Its job is to configure and run the Guest virtual machine.

**What it does:**

  * Runs a virtual machine that contains GuestOS
  * Manages hardware resources
  * Handles system upgrades
  * Provides a security barrier between hardware and the ICP software



### GuestOS

**GuestOS** runs inside a virtual machine on the HostOS. This is where the actual Internet Computer software runs.

**What it does:**

  * Runs the replica
  * Runs canisters and manages their state
  * Participates in consensus with other nodes
  * Manages cryptographic keys and operations



Running GuestOS in a virtual machine ensures every node has the exact same environment, regardless of the underlying hardware. Furthermore, running GuestOS in a virtual machine allows better separation from a potentially malicious host.


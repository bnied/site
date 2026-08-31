# Experience

> Employment history, with the detail behind each role.

## Apple — 2018 - Present

**SRE // ASE Cassandra — 2021 - Present**

**SRE // ACI Postgres — 2020 - 2021**

**SRE // ACI Observability — 2018 - 2020**

## LinkedIn, Inc — 2016 - 2018

**Senior Site Reliability Engineer**

## Work Market, Inc — 2015 - 2016

**Senior DevOps Engineer**

## Shutterstock, Inc — 2013 - 2015

**Site Reliability Engineer**

## Datapipe, Inc — 2008 - 2013

**Datacenter Technician / Operational Support Engineer**

## Apple // ASE Cassandra

**Site Reliability Engineer — 2021 - Present**

- Owned the group's Slackbot, transforming it from a skunkworks project into the team's primary tool for operating Cassandra fleets from Slack: cluster views, nodetool/JMX operations, bad-node detection & remediation, automated pod replacement, and on-call integration — ~300 projects and fixes to date
- Wrote daemon to monitor Cassandra pods in Kubernetes namespaces, track operational states, and auto-replace pods in inoperative states past pre-configured durations
- Wrote daemon to monitor Kubernetes cluster hosts for issues and auto-replace running Cassandra pods when hosts have specific conditions or taints past pre-configured durations
- Drove remediation of a comprehensive automated security review of the automation platform, hardening authorization, input validation, and container/deployment posture across the stack
- Headed project to migrate entire fleet to new monitoring solution with better dashboarding, flexible querying, and alerting
- Added code to bespoke Cassandra cqlsh tool to support new container runtimes and improve overall reliability
- Ran proof-of-concept and QA cycles for the team's Kubernetes-hosted Cassandra offering
- Frontline production support across customer clusters: latency investigations, credential lifecycle, and data recovery
- Diagnosed platform-level Kubernetes issues affecting stateful workloads on shared clusters: CNI/IPAM bugs, storage-provisioner gaps, and stateful-controller reliability

## Apple // ACI Postgres

**Site Reliability Engineer — 2020 - 2021**

- Planned & executed migration of all 2000+ customer PostgreSQL instances to a newer major version ahead of end-of-life, coordinating with many other teams to ensure the rollout landed safely and completely
- Planned & executed the effort to offer a newer PostgreSQL version than the current edition, as part of a larger upgrade project targeting all customer instances within 6 months
- Added failure-rate and latency alerting across the Postgres control plane: API, monitoring, and dashboard services
- Migrated the team's production automation stack onto Kubernetes and enhanced automated bad-node handling
- Devised, wrote, and presented a stability-validation procedure letting services prove their stability to the organization and bypass internal freeze directives during critical periods
- Devised, piloted, and implemented team-level systems ensuring vital functions stayed covered in a way that was fair to the whole team, with visibility and progress properly communicated
- Ensured ongoing consistency of prioritization and current state between the team and management
- Improved team documentation, runbooks, procedures, processes, and on-call load
- Inherited, maintained, and led an org-wide initiative improving learning resources for SREs joining Apple Cloud Services (ACS), spanning multiple teams and including SREs, developers, and cloud advocates from many parts of ACS: built onboarding courses on Kubernetes fundamentals, intro to SRE, and observability, restructured into 30-60 minute modules

## Apple // ACI Observability

**Site Reliability Engineer — 2018 - 2020**

- Technical lead for ACI SRE Observability: helped set technical direction for the SRE teams around improved operation and servicing of existing platforms, while developing migration plans to move customers onto new platforms
- Mentored junior team members on coding and code-release practices, enabling them to write the automation that completed key projects while raising the overall skill level of the team
- Built, maintained, and serviced a series of self-hosted Kubernetes clusters for use across various projects
- Planned & executed migration of the service frontend from Docker Swarm to self-hosted Kubernetes alongside other senior team members: 20+ applications in several languages, along with several data backends
- Created, maintained, and deployed the Helm charts used to migrate applications into Kubernetes
- Wrote runbooks and docs on all aspects of Kubernetes ownership: cluster creation, cluster migration, and repairing parts of a cluster without downtime or performance impact
- Maintained a fleet of Kubernetes clusters for the team's use, including maintenances, repair, and zero-downtime upgrades
- Stood up core services of the next-generation telemetry platform on Kubernetes (alerting rule engine, downsampling, workspace services) and authored its deployment architecture proposal
- Headed an initiative to get SREs involved in and educated on the next-generation telemetry offering
- Built canary release tooling and backup coverage for stateful services as part of the Kubernetes migration
- Peer-reviewed code for team members to ensure solutions met requirements without introducing additional issues
- Created & maintained an initiative to reduce operational toil by streamlining alerts, removing unnecessary ones, and keeping a clear view into the state of the observability system
- Supported the team as an educational resource after departure

## LinkedIn, Inc

**Senior Site Reliability Engineer — 2016 - 2018**

- Led a team of engineers building host-level chaos engineering as part of LinkedIn's Waterbear initiative, measurably improving infrastructure reliability and availability
- Wrote the code enabling CPU-level and network-level chaos engineering for Waterbear
- Presented the host-level chaos initiative at SaltConf17
- Led the weekly design review meeting in the New York office, letting developers present plans to a smaller audience before opening RFCs to wider company-wide scrutiny
- Contributed code to the company monitoring system to enable monitoring on new services and adjust it on existing ones
- Created solutions for developer teams to more effectively monitor the health of their services at a glance
- Created the frontend and API for a company-wide log aggregation and searching service
- Peer-reviewed code to ensure developer strategies made sense and didn't detract from the reliability of their services

## Work Market, Inc

**Senior DevOps Engineer — 2015 - 2016**

- Contributed manifests and modules to the Puppet configuration management tree to facilitate deployment of new technologies and services
- Contributed code to the Fabric tree for administration tasks and code deployments
- Created solutions to facilitate easy provisioning and configuration of new EC2-backed microservice deployments
- Assisted in automating RDS provisioning and configuration to allow rapid deployment of new services
- Streamlined AMI creation into a single Packer pipeline built on CIS hardening guidelines
- Created a system patching strategy allowing the entire infrastructure to be patched and rebooted with zero downtime
- Created and documented production maintenance procedures for better notification, communication, and documentation
- Assisted in documenting procedures for rapidly creating from-scratch Puppet modules for new microservice deployments
- Added Puppet manifests to automatically install and configure collectd on all servers for system metrics collection
- Added Puppet code configuring collectd to collect MySQL metrics for diagnosing and troubleshooting MySQL problems
- Started migrating configuration management from the aging Puppet codebase to a newer, streamlined Saltstack codebase

## Shutterstock, Inc

**Site Reliability Engineer — 2013 - 2015**

- Contributed manifests and modules to the Puppet configuration management tree to facilitate deployment of new technologies and services
- Architected the solution that let Puppet configuration management scale beyond a single master node
- Helped spearhead the Chef-Solo migration, improving CM scale by moving to a master-less, decentralized infrastructure
- Ported Chef cookbooks to Ubuntu 14.04 and CentOS 7 for eventual use in place of CentOS 6
- Improved automation for creating and removing DNS records
- Improved automation for managing LDAP accounts
- Created tools to notify users of on-call assignments
- Maintained the Linux provisioning system; created automation for much faster provisioning across larger numbers of servers
- Maintained and improved the CMDB and project deployment systems
- Maintained and improved Jenkins CI; wrote a dashboard to quickly separate good/bad/unbuilt builds into groups and graph them
- Migrated services from the older build system to the new Jenkins-based build/deploy system

## Datapipe, Inc

**Datacenter Technician / Operational Support — 2008 - 2013**

- Designed, implemented, and maintained the new UNIX provisioning system that replaced the company's previous solution
- Tested Linux distributions for hardware compatibility issues and resolved any issues surfaced in testing
- Developed custom client images tailored to specific needs
- Designed and built a CD/DVD burning solution letting datacenter personnel create installation discs remotely
- Implemented and maintained a new monitoring system complementing the company's existing system
- Designed supplemental applications for the new monitoring system; wrote integration scripts generating incidents in the new ticketing system
- Implemented and maintained the new ticketing/CMDB system, expanding its capacity and capabilities as needed
- Designed and implemented custom maintenance scripts to facilitate system administration functions
- Maintained servers for the Development team to ensure stability and uptime
- Designed, implemented, and maintained a system tracking all server builds while in progress
- Designed, implemented, and maintained a system tracking pulled servers and notifying personnel when drive grace periods expired
- Designed, implemented, and maintained a system tracking inventory through the company's RMA/QA process
- Assembled server and networking hardware per customer orders
- Installed Windows and UNIX OSes on customer servers via PXE, including post-installation steps
- Racked/cabled servers and networking hardware, ran power cables, and set VLANs on networking switches
- Tested Windows and UNIX deployment systems
- Tested hardware for operating system compatibility

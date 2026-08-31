# Apple // ASE Cassandra

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

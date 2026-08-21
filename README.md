# Graph Database Cloud Benchmarking

## Methodology & Fairness
All databases were evaluated using the SNAP `cit-HepPh` dataset (34,546 nodes, 421,578 relationships). To ensure fairness, all platforms were tested on their free tier with equivalent resource limits[cite: 6].

| Platform | vCPU | RAM | Storage |
| :--- | :--- | :--- | :--- |
| **CognoDB** | c0 | 512 MB | 1 GB[cite: 6] |
| **Neo4j AuraDB** | N/A | N/A | 200k nodes / 400k rels[cite: 6] |
| **Memgraph Cloud** | Shared | 2 GB | In-Memory (Cloud)[cite: 6] |
| **FalkorDB / Alternative** | Shared | Managed | Cloud-Hosted |
| **Neo4j Sandbox** | Shared | Sandbox Tier | Cloud-Hosted |

## Benchmark Results

### 1. Data Ingestion
| Platform | Total Time (s) | Relationships/sec |
| :--- | :--- | :--- |
| **CognoDB** | 88.11 | 4,784.55[cite: 6] |
| **Neo4j AuraDB** | (Completed via limit) | ~4,500 (Capped)[cite: 6] |
| **Memgraph Cloud** | 53.44 | 7,888.74[cite: 6] |
| **FalkorDB / Alternative** | 76.72 | 5,494.91 |
| **Neo4j Sandbox** | 140.56 | 2,999.22 |

### 2. Read Workloads (Latency in ms)
| Platform | Point Lookup (p50/p95) | 1-Hop (p50/p95) | 2-Hop (p50/p95) | 3-Hop (p50/p95) | Aggregation (p50/p95) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CognoDB** | 318.76 / 433.27 | 313.77 / 409.79 | 318.89 / 488.36 | 314.95 / 473.28 | 1371.90 / 1601.44[cite: 6] |
| **Neo4j AuraDB** | 112.65 / 135.91 | 111.18 / 135.55 | 110.01 / 129.09 | 110.16 / 128.51 | 179.18 / 295.45[cite: 6] |
| **Memgraph Cloud** | 209.71 / 324.24 | 209.78 / 329.68 | 215.22 / 350.92 | 212.43 / 349.70 | 425.64 / 606.90[cite: 6] |
| **FalkorDB / Alternative**| 195.58 / 323.10 | 180.59 / 293.14 | 187.87 / 322.75 | 190.30 / 320.73 | 397.93 / 537.72 |
| **Neo4j Sandbox** | 261.58 / 376.06 | 274.04 / 383.86 | 318.12 / 389.01 | 262.09 / 381.36 | 383.00 / 505.94 |

### 3. Mixed Workload (20 Clients, 80/20 Mix)
| Platform | Total Queries | Throughput (qps) |
| :--- | :--- | :--- |
| **CognoDB** | 348 | 34.74[cite: 6] |
| **Neo4j AuraDB** | 1,408 | 139.24[cite: 6] |
| **Memgraph Cloud** | 821 | 80.58[cite: 6] |
| **FalkorDB / Alternative**| 810 | 79.81 |
| **Neo4j Sandbox** | 659 | 64.21 |

## Analysis
> **Caveat:** Neo4j AuraDB's Free tier limits relationships to 400,000. Ingestion halted at this limit, resulting in a slightly smaller dataset for its read queries compared to CognoDB and the other cloud instances[cite: 6].
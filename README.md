# Graph Database Cloud Benchmark

A reproducible Node.js benchmark suite for comparing graph database platforms under constrained cloud resources. The project evaluates ingestion throughput, indexed point lookups, multi-hop traversal latency, aggregation queries, and mixed read/write concurrency using the SNAP `cit-HepPh` citation network.

> **Important:** The benchmark results below are the measurements currently recorded in this repository. They are not presented as universal performance claims; cloud tier, network conditions, dataset state, query plans, cache state, and provider configuration can materially change results.

## What is being evaluated?

The current study compares:

- **CognoDB**
- **Neo4j AuraDB**
- **Memgraph Cloud**
- **FalkorDB / Alternative**
- **Neo4j Sandbox**

The benchmark uses the `cit-HepPh` dataset with 34,546 nodes and 421,578 relationships.

## Methodology

The benchmark is designed around three workload categories:

1. **Ingestion** — load the citation graph and measure total wall-clock time and relationships/second.
2. **Read latency** — run 100 measured iterations per query after a warm-up request and report p50/p95 latency.
3. **Mixed workload** — simulate 20 concurrent clients for 10 seconds using an 80% read / 20% write distribution.

The scripts use the Neo4j JavaScript driver and environment-based credentials. The same query shapes are intended to be used across the compared environments.

### Test environment recorded in the study

| Platform | Resource / tier recorded |
|---|---|
| CognoDB | c0 / 512 MB / 1 GB |
| Neo4j AuraDB | Managed / free-tier limits |
| Memgraph Cloud | Shared / 2 GB |
| FalkorDB / Alternative | Shared / managed |
| Neo4j Sandbox | Shared / sandbox tier |

## Results

### Ingestion

| Platform | Total time | Relationships/sec |
|---|---:|---:|
| CognoDB | 88.11 s | 4,784.55 |
| Neo4j AuraDB | Halted at cap | ~4,500 |
| Memgraph Cloud | 53.44 s | 7,888.74 |
| FalkorDB / Alternative | 76.72 s | 5,494.91 |
| Neo4j Sandbox | 140.56 s | 2,999.22 |

### Read latency

Measurements are p50 / p95 in milliseconds.

| Platform | Point lookup | 1-hop | 2-hop | 3-hop | Aggregation |
|---|---:|---:|---:|---:|---:|
| CognoDB | 318.76 / 433.27 | 313.77 / 409.79 | 318.89 / 488.36 | 314.95 / 473.28 | 1371.90 / 1601.44 |
| Neo4j AuraDB | 112.65 / 135.91 | 111.18 / 135.55 | 110.01 / 129.09 | 110.16 / 128.51 | 179.18 / 295.45 |
| Memgraph Cloud | 209.71 / 324.24 | 209.78 / 329.68 | 215.22 / 350.92 | 212.43 / 349.70 | 425.64 / 606.90 |
| FalkorDB / Alternative | 195.58 / 323.10 | 180.59 / 293.14 | 187.87 / 322.75 | 190.30 / 320.73 | 397.93 / 537.72 |
| Neo4j Sandbox | 261.58 / 376.06 | 274.04 / 383.86 | 318.12 / 389.01 | 262.09 / 381.36 | 383.00 / 505.94 |

### Mixed workload

The recorded run used 20 concurrent clients with an 80/20 read/write split.

| Platform | Total queries | Sustained throughput |
|---|---:|---:|
| CognoDB | 348 | 34.74 QPS |
| Neo4j AuraDB | 1,408 | 139.24 QPS |
| Memgraph Cloud | 821 | 80.58 QPS |
| FalkorDB / Alternative | 810 | 79.81 QPS |
| Neo4j Sandbox | 659 | 64.21 QPS |

## Interpretation

The recorded experiment suggests several useful engineering observations:

- **Memgraph Cloud** produced the highest recorded ingestion rate in this run.
- **Neo4j AuraDB** produced the lowest recorded read latency across the tested point lookup and traversal workloads.
- **Neo4j AuraDB** also produced the highest recorded mixed-workload throughput.
- **Aggregation queries** were materially more expensive than point lookup/traversal queries on every tested platform.
- **Free-tier limits matter:** the recorded AuraDB ingestion run stopped at its relationship cap, so its ingestion figure should not be interpreted as a full-dataset unconstrained measurement.

These observations describe this experiment, not a general ranking of graph databases.

## Benchmark implementation

### `setupIndex.js`

Prepares a target database by:

- deleting existing graph data in batches
- creating a `Paper.id` index
- attempting a Neo4j-compatible index definition with a fallback syntax for other Cypher implementations

### `loadData.js`

Streams the citation dataset in batches of 2,000 relationships and uses `UNWIND` + `MERGE` to create `Paper` nodes and `CITES` relationships.

### `benchmark.js`

Runs:

- indexed point lookup
- 1-hop traversal
- 2-hop traversal
- 3-hop traversal
- aggregation/grouping

Each workload has a warm-up request followed by 100 measured iterations.

### `mixedWorkload.js`

Creates 20 concurrent workers for a 10-second run with:

- 80% read operations
- 20% write operations
- an enlarged driver connection pool

Throughput is calculated from total completed queries divided by elapsed test time.

## Project structure

```text
.
├── benchmark.js
├── loadData.js
├── mixedWorkload.js
├── setupIndex.js
├── cit-HepPh.txt
├── package.json
└── README.md
```

## Running the benchmark

### Requirements

- Node.js
- npm
- A reachable graph database compatible with the Neo4j JavaScript driver / Cypher queries used by the scripts
- Credentials for the target database
- The `cit-HepPh` dataset

### Install dependencies

```bash
npm install
```

### Configure environment

Create a local `.env` file:

```env
COGNODB_URI=your_database_uri
COGNODB_USER=your_database_user
COGNODB_PASSWORD=your_database_password
```

Do not commit credentials.

### Prepare the database

```bash
node setupIndex.js
```

### Load the dataset

```bash
node loadData.js
```

### Run read benchmarks

```bash
node benchmark.js
```

### Run mixed workload

```bash
node mixedWorkload.js
```

The scripts currently target the environment variables named `COGNODB_*`; when benchmarking another provider, configure those variables for that target or adapt the connection configuration.

## Reproducibility notes

For meaningful comparisons:

- use the same dataset and query definitions
- record the exact database tier and configuration
- perform a warm-up before latency measurements
- run the same number of iterations
- keep network location consistent where possible
- record p50 and p95 rather than only averages
- document provider-side limits and throttling
- repeat runs when making production or procurement decisions

## Engineering Takeaways

This repository is less about producing a single leaderboard and more about demonstrating how to design a fair, scriptable performance experiment:

- automated data ingestion
- controlled query workloads
- percentile-based latency measurement
- concurrent workload generation
- explicit resource/tier documentation
- environment-based configuration
- reproducible benchmark scripts

## Project Status

Benchmark study and experimentation repository. The recorded results represent the current benchmark run and should be refreshed when infrastructure, provider tiers, dataset versions, or query implementations change.

## Author

**Neha Pattnayak**  
Senior Full Stack Engineer

## License

ISC

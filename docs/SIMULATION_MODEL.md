# Simulation Model and Interpretation Guide

## Purpose

The engine is intended to support introductory process-analysis experiments. It is a deterministic-seed, single-shift, discrete-event teaching model with finite-capacity service stations. It is not a calibrated digital twin or an empirically validated operational forecasting system.

## Time and arrivals

- Shift length: 480 minutes.
- Demand is distributed uniformly through the shift.
- For `N` orders, order `i` arrives at `i × (480 / N)` minutes, for `i = 0 ... N-1`.
- Arrival peaks, breaks, overtime rules, work calendars, and day-to-day variability are not represented.

## Station service and queues

Each station keeps an availability time for each parallel server. A job starts at the later of its arrival to the station and the earliest available server. This is a simple first-available-server rule that approximates FIFO processing for the ordered stream in this case.

| Station | Baseline service time | Baseline servers |
|---|---:|---:|
| Registration | 2 min | 1 |
| Payment | 4 min | 1 |
| Packing | 12 min | 2 |
| Quality | 5 min | 1 |
| Dispatch | 4 min | 1 |

Payment automation sets payment service time to 1.2 minutes and three service channels. The payment failure rate remains unchanged.

## Routing and rework

- Each incoming order first uses registration and payment.
- A payment failure exits via the cancel path.
- A paid order goes to packing and quality inspection.
- Rework probability is 8% in the baseline.
- If rework occurs, the order receives one 6-minute packing correction and one 4-minute re-inspection, then proceeds to dispatch. Multiple loops are not allowed in this pilot.
- The checklist scenario uses a 3% rework probability assumption (capped at 3% for the selected configuration).
- Random outcomes use a seeded PRNG. Baseline and intervention runs share a seed to reduce noise in comparative experiments. The result is reproducible for the same code and inputs.

## Costs

- Labour cost = modelled labour headcount × 120 units per worker per shift.
- Automated payment cost = 45 fixed units + 0.2 units × incoming demand.
- Checklist cost = 20 units per shift.
- Additional packer cost = included through the extra worker's 120-unit labour assumption.
- Equipment depreciation, training time, failure recovery, refunds, downstream delivery costs, and indirect overhead are excluded.

## Metrics

- **Completed:** paid orders that reach dispatch.
- **Completed within shift:** completed orders whose dispatch completion time is no later than minute 480.
- **Average cycle time:** mean arrival-to-dispatch duration among completed orders only. Cancelled orders are excluded.
- **Median / P90 cycle:** percentile of completed-order cycle durations.
- **Average wait per queue visit:** total recorded wait across all station visits divided by total station visits. One order may contribute multiple visits due to rework.
- **Station workload:** total busy service minutes divided by the station's available server-minutes (servers × shift length). Values above 100% flag workload exceeding nominal shift capacity in this simplified accounting.
- **First-pass yield:** paid orders that do not enter rework divided by paid orders.
- **Rework rate observed:** reworked paid orders divided by paid orders.
- **Cost per completed order:** total modelled shift cost divided by completed orders.

## Interpretation cautions

1. A high workload percentage is a bottleneck candidate, not proof of root cause. Queue, service, routing, and demand evidence must be considered together.
2. Utilisation above 100% is a warning that accumulated work exceeds nominal shift capacity; it is not a realistic steady-state utilisation measure.
3. Cycle time excludes cancelled orders, while wait-per-queue-visit uses the visits recorded for the incoming stream. These denominators differ.
4. Throughput is bounded by routing failures, station capacity, and the single-shift horizon.
5. An intervention may move the bottleneck rather than eliminate it.
6. Reducing rework probability is an assumed intervention effect. A real study would need process data or experimental evidence.
7. The same random seed improves paired comparison but does not remove model uncertainty.
8. Do not use these outputs to make real staffing or investment decisions without validating the process map, distributions, capacities, and cost assumptions against organizational data.

## Recommended extension for advanced work

- Add stochastic inter-arrival and processing-time distributions.
- Model time-dependent demand and staff calendars.
- Add multiple rework loops and exception routes.
- Track work-in-process over time and report time-weighted averages.
- Use multiple replications and confidence intervals.
- Calibrate with event logs and compare model output to observed cycle-time/throughput distributions.
- Add sensitivity analysis and scenario discovery.

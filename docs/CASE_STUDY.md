# Case Study — Sepehr Online Store Order Fulfilment

## Case context

Sepehr is a fictional online retailer. Paid orders are registered, checked by a payment step, collected and packed, inspected, and handed to dispatch. Failed payment orders are cancelled. Packages that fail quality inspection return once to packing for correction and then pass through quality inspection again.

## Management concern

The teaching case presents three concerns: order delays, queue accumulation around packing, and rework after quality inspection. Students must diagnose the likely source before selecting an intervention.

## Process boundary

**Start:** order is received by the store's order process.

**End:** a quality-approved package is handed to dispatch. Last-mile delivery is outside the scope of this pilot.

## Baseline parameters

| Parameter | Baseline | Unit |
|---|---:|---|
| Demand | 80 | orders / 480-minute shift |
| Shift length | 480 | minutes |
| Packers | 2 | people |
| Packing duration | 12 | minutes / order |
| Rework probability | 8 | percent of paid orders |
| Payment failure | 4 | percent of incoming orders |
| Labour cost | 120 | training cost units / worker / shift |
| Payment automation | Off | Boolean |
| Checklist intervention | Off | Boolean |
| Additional packer | 0 | people |

## Activities

| Activity | BPMN concept | Duration | Resource assumption |
|---|---|---:|---:|
| Register order | User Task | 2 min | 1 clerk |
| Confirm payment | Service Task in the case model | 4 min in baseline | 1 constrained service channel |
| Payment successful? | Exclusive Gateway | Immediate | None |
| Cancel order | End path | Immediate | None |
| Pick and pack | User Task | 12 min | 2 packers |
| Quality inspection | User Task | 5 min | 1 inspector |
| Package acceptable? | Exclusive Gateway | Immediate | None |
| Dispatch handoff | User Task | 4 min | 1 dispatch clerk |
| End | End Event | Immediate | None |

## Interventions

1. **Automate payment confirmation:** payment service duration becomes 1.2 minutes with three parallel service channels; the payment failure route remains. Assumed cost is 45 fixed units plus 0.2 units per incoming order. The intervention reduces the manual staffing assumption for this station in the model.
2. **Packing checklist:** rework probability is capped at 3% for the scenario and a fixed 20-unit shift cost is added. This is an assumed effect for teaching, not a proven causal estimate.
3. **Add one packer:** one additional packing server is available for the whole shift at an additional 120 cost units.

## Student tasks

- Read the process and explain the exclusive gateways and rework loop.
- Use diagnostic evidence to identify a bottleneck candidate.
- Compute the nominal packing capacity.
- Compare a resource intervention with a quality intervention.
- Test the demand shock and observe queue propagation.
- Recommend a scenario under a cost ceiling while protecting quality.
- Explain why the simulation result cannot automatically be treated as an operational forecast.

All figures are fictitious training values. The case should not be described as a real company study.

# Model Iteration Playbook

## Weekly Review Queries

### 1) Estimate edit rate

```sql
select
  date_trunc('day', created_at) as day,
  count(*) as requests,
  count(distinct request_id) filter (where request_id is not null) as corrected_requests
from estimation_corrections
group by 1
order by 1 desc;
```

### 2) Most corrected fields

```sql
select field_name, count(*) as edits
from estimation_corrections
group by field_name
order by edits desc
limit 20;
```

### 3) Confidence distribution

```sql
select
  width_bucket(confidence, 0, 1, 10) as bucket,
  count(*) as request_count
from estimation_requests
where confidence is not null
group by 1
order by 1;
```

## Iteration Process

1. Identify top correction patterns by cuisine and meal type.
2. Update provider prompt/mapping for top 2 error classes.
3. Release update behind feature flag for internal users.
4. Compare edit rate and low-confidence rate after rollout.

drop policy if exists "estimation_corrections_own_all" on public.estimation_corrections;
create policy "estimation_corrections_own_all" on public.estimation_corrections for all
  using (
    exists (
      select 1
      from public.estimation_requests r
      where r.id = estimation_corrections.request_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.estimation_requests r
      where r.id = estimation_corrections.request_id
        and r.user_id = auth.uid()
    )
  );

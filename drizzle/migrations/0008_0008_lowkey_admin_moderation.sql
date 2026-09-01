-- admins can moderate everything; users see only their own reports/roles

-- grant update so admins can resolve reports (only the admin policy below allows it)
grant update on public.reports to authenticated;

create policy "admins can delete any post"
on public.posts for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "admins can delete any comment"
on public.post_comments for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "admins can delete any message"
on public.messages for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "admins can read all profiles"
on public.profiles for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- a user may read their own role row; has_role stays security definer for checks
create policy "read own role"
on public.user_roles for select to authenticated
using (user_id = auth.uid());

create policy "admins read all reports"
on public.reports for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "admins update reports"
on public.reports for update to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- resolved reports disappear from the inbox
create policy "admins delete reports"
on public.reports for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));
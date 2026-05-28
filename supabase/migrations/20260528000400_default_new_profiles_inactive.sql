alter table public.profiles
alter column status set default 'inactive';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.profiles (
        id,
        email,
        role,
        status
    )
    values (
        new.id,
        new.email,
        'member',
        'inactive'
    )
    on conflict (id) do nothing;

    return new;

end;
$$;
